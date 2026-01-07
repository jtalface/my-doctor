/**
 * WebRTC Service
 * 
 * Handles peer-to-peer audio calls using WebRTC.
 * Uses polling for signaling since we don't have WebSocket.
 */

import * as api from './api';

// STUN servers for NAT traversal (free Google servers)
const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

export type CallState = 
  | 'idle'
  | 'initiating'
  | 'ringing'
  | 'connecting'
  | 'active'
  | 'ended'
  | 'failed';

export interface CallEventHandlers {
  onStateChange: (state: CallState) => void;
  onRemoteStream: (stream: MediaStream) => void;
  onError: (error: string, canFallback: boolean) => void;
  onEnded: (reason: string, duration?: number) => void;
}

export class WebRTCCall {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callId: string | null = null;
  private isCaller: boolean = false;
  private pollingInterval: number | null = null;
  private handlers: CallEventHandlers;
  private state: CallState = 'idle';
  private iceCandidatesQueue: RTCIceCandidateInit[] = [];
  private hasRemoteDescription: boolean = false;
  private lastIceIndex: number = 0;
  private connectionTimeout: number | null = null;
  private isEnding: boolean = false;

  constructor(handlers: CallEventHandlers) {
    this.handlers = handlers;
  }

  private setState(newState: CallState) {
    this.state = newState;
    this.handlers.onStateChange(newState);
  }

  /**
   * Check if WebRTC is supported
   */
  static isSupported(): boolean {
    return !!(
      navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function' &&
      window.RTCPeerConnection
    );
  }

  /**
   * Initiate an outgoing call
   */
  async initiateCall(conversationId: string): Promise<void> {
    if (!WebRTCCall.isSupported()) {
      this.handlers.onError('WebRTC is not supported in this browser', true);
      return;
    }

    try {
      this.setState('initiating');
      this.isCaller = true;

      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Initiate call on server
      const { callId } = await api.initiateCall(conversationId);
      this.callId = callId;

      // Create peer connection
      this.createPeerConnection();

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Create and send offer
      const offer = await this.peerConnection!.createOffer();
      await this.peerConnection!.setLocalDescription(offer);
      await api.sendOffer(callId, offer);

      this.setState('ringing');

      // Start polling for answer
      this.startPolling();
    } catch (error) {
      console.error('[WebRTC] Initiate call error:', error);
      this.handleError(error);
    }
  }

  /**
   * Answer an incoming call
   */
  async answerCall(callInfo: api.CallInfo): Promise<void> {
    if (!WebRTCCall.isSupported()) {
      this.handlers.onError('WebRTC is not supported in this browser', true);
      return;
    }

    try {
      this.setState('connecting');
      this.isCaller = false;
      this.callId = callInfo.callId;

      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: false,
      });

      // Create peer connection
      this.createPeerConnection();

      // Add local stream
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Get the offer - either from callInfo or poll for it
      let offer = callInfo.offer;
      if (!offer) {
        console.log('[WebRTC] Offer not in callInfo, polling for it...');
        // Poll for the offer (it might not be ready yet)
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          const status = await api.getCallStatus(callInfo.callId, 0);
          if (status.offer) {
            offer = status.offer;
            console.log('[WebRTC] Got offer from polling');
            break;
          }
          if (status.status === 'ended' || status.status === 'declined' || status.status === 'failed') {
            throw new Error('Call ended before offer was received');
          }
        }
      }

      if (!offer) {
        throw new Error('Failed to get offer from caller');
      }

      // Set remote description (offer)
      await this.peerConnection!.setRemoteDescription(offer);
      this.hasRemoteDescription = true;
      
      // Process queued ICE candidates
      await this.processIceCandidateQueue();

      // Create and send answer
      const answer = await this.peerConnection!.createAnswer();
      await this.peerConnection!.setLocalDescription(answer);
      await api.sendAnswer(callInfo.callId, answer);

      // Start polling for ICE candidates
      this.startPolling();
    } catch (error) {
      console.error('[WebRTC] Answer call error:', error);
      this.handleError(error);
    }
  }

  /**
   * End the current call
   */
  async endCall(reason: string = 'completed'): Promise<void> {
    // Prevent multiple end calls
    if (this.isEnding || this.state === 'ended') {
      return;
    }
    this.isEnding = true;
    
    if (this.callId) {
      try {
        const result = await api.endCall(this.callId, reason);
        this.handlers.onEnded(reason, result.duration);
      } catch (error) {
        console.error('[WebRTC] End call error:', error);
      }
    }
    this.cleanup();
    this.setState('ended');
  }

  /**
   * Decline an incoming call
   */
  async declineCall(): Promise<void> {
    if (this.callId) {
      try {
        await api.declineCall(this.callId);
      } catch (error) {
        console.error('[WebRTC] Decline call error:', error);
      }
    }
    this.cleanup();
    this.setState('idle');
  }

  /**
   * Toggle mute
   */
  toggleMute(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return !audioTrack.enabled; // Return true if now muted
      }
    }
    return false;
  }

  /**
   * Mark that fallback was used
   */
  async useFallback(): Promise<void> {
    if (this.callId) {
      try {
        await api.markCallFallback(this.callId);
      } catch (error) {
        console.error('[WebRTC] Fallback error:', error);
      }
    }
    this.cleanup();
    this.setState('failed');
  }

  /**
   * Get current call ID
   */
  getCallId(): string | null {
    return this.callId;
  }

  /**
   * Get current state
   */
  getState(): CallState {
    return this.state;
  }

  private createPeerConnection() {
    this.peerConnection = new RTCPeerConnection({
      iceServers: ICE_SERVERS,
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.callId) {
        try {
          await api.sendIceCandidate(this.callId, event.candidate.toJSON());
        } catch (error) {
          console.error('[WebRTC] Send ICE candidate error:', error);
        }
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('[WebRTC] Connection state:', state);
      
      if (state === 'connected') {
        this.setState('active');
      } else if (state === 'failed' || state === 'disconnected') {
        this.handleError(new Error('Connection lost'));
      }
    };

    // Handle ICE connection state
    this.peerConnection.oniceconnectionstatechange = () => {
      const state = this.peerConnection?.iceConnectionState;
      console.log('[WebRTC] ICE state:', state);
      
      if (state === 'connected' || state === 'completed') {
        this.setState('active');
      } else if (state === 'failed') {
        this.handleError(new Error('ICE connection failed'));
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('[WebRTC] Remote track received');
      this.remoteStream = event.streams[0];
      if (this.remoteStream) {
        this.handlers.onRemoteStream(this.remoteStream);
      }
    };
  }

  private async processIceCandidateQueue() {
    while (this.iceCandidatesQueue.length > 0) {
      const candidate = this.iceCandidatesQueue.shift();
      if (candidate && this.peerConnection) {
        try {
          await this.peerConnection.addIceCandidate(candidate);
        } catch (error) {
          console.error('[WebRTC] Add queued ICE candidate error:', error);
        }
      }
    }
  }

  private startPolling() {
    // Set a connection timeout (30 seconds for ringing, 60 seconds for connecting)
    const timeoutMs = this.isCaller ? 30000 : 60000;
    this.connectionTimeout = window.setTimeout(() => {
      if (this.state === 'ringing' || this.state === 'connecting') {
        console.log('[WebRTC] Connection timeout');
        this.handleError(new Error('Connection timed out'));
      }
    }, timeoutMs);
    
    // Poll every 500ms for signaling updates
    this.pollingInterval = window.setInterval(async () => {
      if (!this.callId) return;

      try {
        const status = await api.getCallStatus(this.callId, this.lastIceIndex);

        // Check if call ended
        if (status.status === 'ended' || status.status === 'declined' || 
            status.status === 'missed' || status.status === 'failed') {
          this.handlers.onEnded(status.endReason || status.status, status.duration);
          this.cleanup();
          this.setState('ended');
          return;
        }

        // Handle answer (for caller)
        if (this.isCaller && status.answer && !this.hasRemoteDescription) {
          console.log('[WebRTC] Received answer from callee');
          await this.peerConnection!.setRemoteDescription(status.answer);
          this.hasRemoteDescription = true;
          await this.processIceCandidateQueue();
        }

        // Handle ICE candidates (only new ones, based on lastIceIndex)
        if (status.iceCandidates && status.iceCandidates.length > 0) {
          console.log(`[WebRTC] Received ${status.iceCandidates.length} new ICE candidates`);
          for (const candidate of status.iceCandidates) {
            if (this.hasRemoteDescription) {
              try {
                await this.peerConnection!.addIceCandidate(candidate);
              } catch (error) {
                console.error('[WebRTC] Add ICE candidate error:', error);
              }
            } else {
              this.iceCandidatesQueue.push(candidate);
            }
          }
        }
        
        // Update lastIceIndex for next poll
        if (status.iceIndex !== undefined) {
          this.lastIceIndex = status.iceIndex;
        }
      } catch (error) {
        console.error('[WebRTC] Polling error:', error);
      }
    }, 500);
  }

  private handleError(error: unknown) {
    console.error('[WebRTC] Error:', error);
    
    let errorMessage = 'Call failed';
    let canFallback = true;

    if (error instanceof Error) {
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Microphone access denied. Please allow microphone access and try again.';
        canFallback = true;
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone.';
        canFallback = true;
      } else if (error.message.includes('ICE')) {
        errorMessage = 'Network connection failed. Try using the phone number instead.';
        canFallback = true;
      } else {
        errorMessage = error.message;
      }
    }

    this.handlers.onError(errorMessage, canFallback);
    this.cleanup();
    this.setState('failed');
  }

  private cleanup() {
    // Stop polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Clear connection timeout
    if (this.connectionTimeout) {
      clearTimeout(this.connectionTimeout);
      this.connectionTimeout = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.hasRemoteDescription = false;
    this.iceCandidatesQueue = [];
    this.lastIceIndex = 0;
  }
}

/**
 * Poll for incoming calls
 */
export function createIncomingCallPoller(
  onIncomingCall: (call: api.CallInfo) => void,
  intervalMs: number = 3000
): () => void {
  let isPolling = true;

  const poll = async () => {
    while (isPolling) {
      try {
        const result = await api.checkIncomingCall();
        if (result.hasIncomingCall && result.call) {
          onIncomingCall(result.call);
        }
      } catch (error) {
        // Ignore polling errors
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
  };

  poll();

  // Return cleanup function
  return () => {
    isPolling = false;
  };
}

