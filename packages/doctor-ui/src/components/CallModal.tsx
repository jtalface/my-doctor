/**
 * Call Modal
 * 
 * Full-screen modal for active audio calls.
 * Shows call status, duration, and controls.
 */

import { useState, useEffect, useRef } from 'react';
import { WebRTCCall, CallState } from '../services/webrtc';
import styles from './CallModal.module.css';

interface CallModalProps {
  callInstance: WebRTCCall;
  remoteName: string;
  remotePhone?: string;
  isIncoming: boolean;
  onClose: () => void;
}

export default function CallModal({
  callInstance,
  remoteName,
  remotePhone,
  isIncoming,
  onClose,
}: CallModalProps) {
  const [callState, setCallState] = useState<CallState>('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const durationIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    // Duration timer when call is active
    if (callState === 'active') {
      durationIntervalRef.current = window.setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } else if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, [callState]);

  // Set audio output to speaker if toggled
  useEffect(() => {
    if (audioRef.current && 'setSinkId' in audioRef.current) {
      // This API is not widely supported, but we try anyway
      // @ts-ignore
      audioRef.current.setSinkId?.(isSpeaker ? 'default' : '');
    }
  }, [isSpeaker]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRemoteStream = (stream: MediaStream) => {
    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.play().catch(console.error);
    }
  };

  const handleStateChange = (state: CallState) => {
    setCallState(state);
    if (state === 'ended' || state === 'failed') {
      setTimeout(onClose, 2000);
    }
  };

  const handleError = (errorMsg: string, canFallback: boolean) => {
    setError(errorMsg);
    if (canFallback && remotePhone) {
      setShowFallback(true);
    }
  };

  const handleEnded = (_reason: string, _duration?: number) => {
    setCallState('ended');
    setTimeout(onClose, 2000);
  };

  // Set up handlers on mount
  useEffect(() => {
    // @ts-ignore - We're setting handlers after construction
    callInstance.handlers = {
      onStateChange: handleStateChange,
      onRemoteStream: handleRemoteStream,
      onError: handleError,
      onEnded: handleEnded,
    };

    // Get initial state
    setCallState(callInstance.getState());
  }, [callInstance]);

  const handleMuteToggle = () => {
    const muted = callInstance.toggleMute();
    setIsMuted(muted);
  };

  const handleSpeakerToggle = () => {
    setIsSpeaker(!isSpeaker);
  };

  const handleEndCall = () => {
    callInstance.endCall();
  };

  const handleFallback = async () => {
    await callInstance.useFallback();
    if (remotePhone) {
      window.location.href = `tel:${remotePhone}`;
    }
  };

  const getStatusText = (): string => {
    switch (callState) {
      case 'initiating':
        return 'Starting call...';
      case 'ringing':
        return 'Ringing...';
      case 'connecting':
        return 'Connecting...';
      case 'active':
        return formatDuration(duration);
      case 'ended':
        return 'Call ended';
      case 'failed':
        return 'Call failed';
      default:
        return '';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        {/* Hidden audio element for remote stream */}
        <audio ref={audioRef} autoPlay playsInline />

        {/* Avatar */}
        <div className={styles.avatar}>
          {remoteName.charAt(0).toUpperCase()}
        </div>

        {/* Name & Status */}
        <h2 className={styles.name}>{remoteName}</h2>
        <p className={styles.status}>{getStatusText()}</p>

        {/* Error message */}
        {error && (
          <div className={styles.error}>
            <p>{error}</p>
          </div>
        )}

        {/* Fallback option */}
        {showFallback && remotePhone && (
          <div className={styles.fallback}>
            <p>Having trouble connecting?</p>
            <button onClick={handleFallback} className={styles.fallbackBtn}>
              📞 Call {remotePhone}
            </button>
          </div>
        )}

        {/* Controls */}
        {(callState === 'active' || callState === 'ringing' || callState === 'connecting') && (
          <div className={styles.controls}>
            <button
              className={`${styles.controlBtn} ${isMuted ? styles.active : ''}`}
              onClick={handleMuteToggle}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🎤'}
              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
            </button>

            <button
              className={`${styles.controlBtn} ${styles.endCall}`}
              onClick={handleEndCall}
              title="End call"
            >
              📞
              <span>End</span>
            </button>

            <button
              className={`${styles.controlBtn} ${isSpeaker ? styles.active : ''}`}
              onClick={handleSpeakerToggle}
              title={isSpeaker ? 'Use earpiece' : 'Use speaker'}
            >
              {isSpeaker ? '🔊' : '🔈'}
              <span>Speaker</span>
            </button>
          </div>
        )}

        {/* Ended state - just show close button */}
        {(callState === 'ended' || callState === 'failed') && (
          <button className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        )}
      </div>
    </div>
  );
}

