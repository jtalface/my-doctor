/**
 * Conversations Page
 * 
 * List of all patient conversations.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import styles from './ConversationsPage.module.css';

type StatusFilter = 'active' | 'archived' | 'closed' | 'all';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<api.Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('active');

  useEffect(() => {
    const loadConversations = async () => {
      setIsLoading(true);
      try {
        const res = await api.getConversations(1, filter);
        setConversations(res.conversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadConversations();
  }, [filter]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Messages</h1>
        <div className={styles.filters}>
          {(['active', 'archived', 'closed', 'all'] as StatusFilter[]).map((status) => (
            <button
              key={status}
              className={`${styles.filterBtn} ${filter === status ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </header>

      {isLoading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      ) : conversations.length > 0 ? (
        <div className={styles.list}>
          {conversations.map((conv) => (
            <Link
              key={conv._id}
              to={`/conversations/${conv._id}`}
              className={`${styles.conversationCard} ${conv.unreadCount > 0 ? styles.hasUnread : ''}`}
            >
              <div className={styles.avatar}>
                {conv.patient?.name?.charAt(0) || 'P'}
              </div>
              <div className={styles.content}>
                <div className={styles.top}>
                  <span className={styles.patientName}>
                    {conv.patient?.name || 'Patient'}
                    {conv.dependent && (
                      <span className={styles.dependentTag}>
                        • {conv.dependent.name}
                      </span>
                    )}
                  </span>
                  <span className={styles.time}>{formatTime(conv.lastMessageAt)}</span>
                </div>
                {conv.subject && (
                  <span className={styles.subject}>{conv.subject}</span>
                )}
                <p className={styles.preview}>
                  {conv.lastMessageSenderType === 'provider' && (
                    <span className={styles.youLabel}>You: </span>
                  )}
                  {conv.lastMessagePreview || 'No messages yet'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <span className={styles.unreadBadge}>{conv.unreadCount}</span>
              )}
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>💬</span>
          <h3>No conversations</h3>
          <p>When patients message you, they'll appear here.</p>
        </div>
      )}
    </div>
  );
}

