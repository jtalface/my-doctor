/**
 * Call Context
 * 
 * Handles incoming call polling and provides call-related state to the app.
 */

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../auth';
import { api } from '../services/api';
import { WebRTCCall, IncomingCallInfo, CallState } from '../services/webrtc';
import IncomingCall from '../components/IncomingCall';
import CallModal from '../components/CallModal';

interface CallContextType {
  // State
  incomingCall: IncomingCallInfo | null;
  activeCall: WebRTCCall | null;
  callState: CallState;
  
  // Actions
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export function useCallContext() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCallContext must be used within a CallProvider');
  }
  return context;
}

interface CallProviderProps {
  children: React.ReactNode;
}

export function CallProvider({ children }: CallProviderProps) {
  const { isAuthenticated } = useAuth();
  const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
  const [activeCall, setActiveCall] = useState<WebRTCCall | null>(null);
  const [callState, setCallState] = useState<CallState>('idle');
  const [remoteName, setRemoteName] = useState<string>('');
  const [remotePhone, setRemotePhone] = useState<string | undefined>(undefined);
  const pollingRef = useRef<boolean>(false);
  const pollIntervalRef = useRef<number | null>(null);
  const lastCallIdRef = useRef<string | null>(null);
  const isEndingRef = useRef<boolean>(false);

  // Poll for incoming calls
  useEffect(() => {
    if (!isAuthenticated) {
      // Clear polling when not authenticated
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      pollingRef.current = false;
      return;
    }

    // Don't poll if we already have an active call or incoming call
    if (activeCall || incomingCall) {
      return;
    }

    pollingRef.current = true;

    const poll = async () => {
      if (!pollingRef.current) return;
      
      try {
        const result = await api.checkIncomingCall();
        if (result.hasIncomingCall && result.call) {
          // Avoid showing the same call multiple times
          if (result.call.callId !== lastCallIdRef.current) {
            lastCallIdRef.current = result.call.callId;
            setIncomingCall(result.call);
            setRemoteName(result.call.callerName);
            setRemotePhone(result.call.callerPhone);
          }
        }
      } catch (error) {
        // Ignore polling errors silently
      }
    };

    // Poll immediately and then every 3 seconds
    poll();
    pollIntervalRef.current = window.setInterval(poll, 3000);

    return () => {
      pollingRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, activeCall, incomingCall]);

  // Accept an incoming call
  const acceptCall = useCallback(() => {
    if (!incomingCall) return;

    const call = new WebRTCCall({
      onStateChange: (state: CallState) => {
        console.log('[CallContext] State changed:', state);
        setCallState(state);
        if (state === 'ended' || state === 'failed') {
          setActiveCall(null);
          setCallState('idle');
          lastCallIdRef.current = null;
        }
      },
      onRemoteStream: () => {
        // Handled in CallModal
      },
      onError: (errorMsg: string, canFallback: boolean) => {
        console.error('[CallContext] Error:', errorMsg, canFallback);
      },
      onEnded: () => {
        setActiveCall(null);
        setCallState('idle');
        lastCallIdRef.current = null;
      },
    });

    setActiveCall(call);
    setIncomingCall(null);
    setCallState('connecting');

    // Answer the call
    call.answerCall(incomingCall);
  }, [incomingCall]);

  // Decline an incoming call
  const declineCall = useCallback(async () => {
    if (incomingCall) {
      try {
        await api.declineCall(incomingCall.callId);
      } catch (error) {
        console.error('[CallContext] Decline error:', error);
      }
      setIncomingCall(null);
      lastCallIdRef.current = null;
    }
  }, [incomingCall]);

  // End the active call
  // End the active call
  const endCall = useCallback(() => {
    if (activeCall && !isEndingRef.current) {
      isEndingRef.current = true;
      activeCall.endCall();
      setActiveCall(null);
      setCallState('idle');
      lastCallIdRef.current = null;
      // Reset the flag after a short delay
      setTimeout(() => { isEndingRef.current = false; }, 1000);
    }
  }, [activeCall]);

  // Handle closing the call modal (called when call ends or user closes)
  const handleCloseCall = useCallback(() => {
    // Prevent recursive calls - only end if not already ending
    if (activeCall && !isEndingRef.current) {
      isEndingRef.current = true;
      activeCall.endCall();
    }
    setActiveCall(null);
    setCallState('idle');
    lastCallIdRef.current = null;
    // Reset the flag after a short delay
    setTimeout(() => { isEndingRef.current = false; }, 1000);
  }, [activeCall]);

  return (
    <CallContext.Provider value={{
      incomingCall,
      activeCall,
      callState,
      acceptCall,
      declineCall,
      endCall,
    }}>
      {children}
      
      {/* Incoming call notification */}
      {incomingCall && !activeCall && (
        <IncomingCall
          call={incomingCall}
          onAccept={acceptCall}
          onDecline={declineCall}
        />
      )}
      
      {/* Active call modal */}
      {activeCall && callState !== 'idle' && (
        <CallModal
          callInstance={activeCall}
          remoteName={remoteName}
          remotePhone={remotePhone}
          isIncoming={true}
          onClose={handleCloseCall}
        />
      )}
    </CallContext.Provider>
  );
}

