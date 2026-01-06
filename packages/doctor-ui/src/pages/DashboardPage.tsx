/**
 * Dashboard Page
 * 
 * Overview of doctor's activity and quick stats.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth';
import * as api from '../services/api';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { doctor } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [patientCount, setPatientCount] = useState(0);
  const [recentConversations, setRecentConversations] = useState<api.Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [unreadRes, patientsRes, conversationsRes] = await Promise.all([
          api.getUnreadCount(),
          api.getPatients(),
          api.getConversations(1, 'active'),
        ]);
        setUnreadCount(unreadRes.unreadCount);
        setPatientCount(patientsRes.patients.length);
        setRecentConversations(conversationsRes.conversations.slice(0, 5));
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

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

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Welcome Header */}
      <header className={styles.header}>
        <div className={styles.welcome}>
          <h1>{getGreeting()}, {doctor?.title} {doctor?.name?.split(' ')[0]}</h1>
          <p>Here's what's happening with your patients today.</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>💬</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{unreadCount}</span>
            <span className={styles.statLabel}>Unread Messages</span>
          </div>
          <Link to="/conversations" className={styles.statLink}>View all →</Link>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{patientCount}</span>
            <span className={styles.statLabel}>Active Patients</span>
          </div>
          <Link to="/patients" className={styles.statLink}>View all →</Link>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>📅</div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{recentConversations.length}</span>
            <span className={styles.statLabel}>Active Conversations</span>
          </div>
        </div>
      </div>

      {/* Recent Conversations */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Recent Messages</h2>
          <Link to="/conversations" className={styles.viewAll}>View all</Link>
        </div>

        {recentConversations.length > 0 ? (
          <div className={styles.conversationList}>
            {recentConversations.map((conv) => (
              <Link
                key={conv._id}
                to={`/conversations/${conv._id}`}
                className={styles.conversationCard}
              >
                <div className={styles.conversationAvatar}>
                  {conv.patient?.name?.charAt(0) || 'P'}
                </div>
                <div className={styles.conversationContent}>
                  <div className={styles.conversationHeader}>
                    <span className={styles.patientName}>{conv.patient?.name || 'Patient'}</span>
                    <span className={styles.conversationTime}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className={styles.conversationPreview}>
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
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>📭</span>
            <p>No conversations yet</p>
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className={styles.section}>
        <h2>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link to="/conversations" className={styles.actionCard}>
            <span className={styles.actionIcon}>💬</span>
            <span className={styles.actionLabel}>View Messages</span>
          </Link>
          <Link to="/patients" className={styles.actionCard}>
            <span className={styles.actionIcon}>📋</span>
            <span className={styles.actionLabel}>Patient Records</span>
          </Link>
          <Link to="/profile" className={styles.actionCard}>
            <span className={styles.actionIcon}>⚙️</span>
            <span className={styles.actionLabel}>Settings</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

