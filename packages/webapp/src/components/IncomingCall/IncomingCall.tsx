/**
 * Incoming Call Notification
 * 
 * Shows a notification when there's an incoming call.
 * Allows accepting or declining the call.
 */

import { useTranslate } from '../../i18n';
import { IncomingCallInfo } from '../../services/webrtc';
import styles from './IncomingCall.module.css';

interface IncomingCallProps {
  call: IncomingCallInfo;
  onAccept: () => void;
  onDecline: () => void;
}

export default function IncomingCall({ call, onAccept, onDecline }: IncomingCallProps) {
  const t = useTranslate();
  
  return (
    <div className={styles.overlay}>
      <div className={styles.notification}>
        {/* Animated rings */}
        <div className={styles.rings}>
          <div className={styles.ring}></div>
          <div className={styles.ring}></div>
          <div className={styles.ring}></div>
          <div className={styles.avatar}>
            {call.callerName.charAt(0).toUpperCase()}
          </div>
        </div>

        {/* Caller info */}
        <h2 className={styles.name}>{call.callerName}</h2>
        <p className={styles.label}>{t('call_incoming_audio')}</p>

        {/* Actions */}
        <div className={styles.actions}>
          <button className={styles.declineBtn} onClick={onDecline}>
            <span className={styles.icon}>✕</span>
            <span>{t('call_decline')}</span>
          </button>
          <button className={styles.acceptBtn} onClick={onAccept}>
            <span className={styles.icon}>📞</span>
            <span>{t('call_accept')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

