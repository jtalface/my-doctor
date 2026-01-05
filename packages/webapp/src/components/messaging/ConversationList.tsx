/**
 * ConversationList Component
 * 
 * Displays a list of conversations with providers.
 */

import { Conversation } from '../../services/api';
import { useTranslate } from '../../i18n';
import styles from './ConversationList.module.css';

interface ConversationListProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (conversation: Conversation) => void;
  onNewConversation: () => void;
  isLoading?: boolean;
}

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  onNewConversation,
  isLoading,
}: ConversationListProps) {
  const t = useTranslate();

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('messages_yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('messages_title')}</h2>
          <button className={styles.newButton} disabled>+</button>
        </div>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('messages_title')}</h2>
        <button 
          className={styles.newButton} 
          onClick={onNewConversation}
          title={t('messages_new_conversation')}
        >
          +
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyIcon}>💬</span>
          <p>{t('messages_no_conversations')}</p>
          <button className={styles.startButton} onClick={onNewConversation}>
            {t('messages_start_conversation')}
          </button>
        </div>
      ) : (
        <div className={styles.list}>
          {conversations.map(conversation => {
            const provider = conversation.provider;
            const isSelected = conversation._id === selectedId;
            const hasUnread = conversation.unreadByPatient > 0;
            
            return (
              <button
                key={conversation._id}
                className={`${styles.item} ${isSelected ? styles.selected : ''} ${hasUnread ? styles.unread : ''}`}
                onClick={() => onSelect(conversation)}
              >
                <div className={styles.avatar}>
                  {provider?.avatarUrl ? (
                    <img src={provider.avatarUrl} alt="" />
                  ) : (
                    <span>{provider?.name?.[0] || '?'}</span>
                  )}
                  <span className={`${styles.status} ${provider?.isOnline ? styles.online : styles.offline}`} />
                </div>
                
                <div className={styles.info}>
                  <div className={styles.topRow}>
                    <span className={styles.name}>
                      {provider?.title} {provider?.name || t('messages_unknown_provider')}
                    </span>
                    <span className={styles.time}>
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  </div>
                  <div className={styles.bottomRow}>
                    <span className={styles.preview}>
                      {conversation.lastMessageSenderType === 'patient' && 
                        <span className={styles.you}>{t('messages_you')}: </span>
                      }
                      {conversation.lastMessagePreview || t('messages_no_messages')}
                    </span>
                    {hasUnread && (
                      <span className={styles.badge}>{conversation.unreadByPatient}</span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

