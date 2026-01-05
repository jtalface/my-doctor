/**
 * MessagesPage
 * 
 * Main page for patient-doctor messaging.
 * Shows conversation list and chat window.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, Conversation } from '../services/api';
import { useActiveProfile } from '../contexts';
import { useTranslate } from '../i18n';
import { 
  ConversationList, 
  ChatWindow, 
  NewConversationModal 
} from '../components/messaging';
import styles from './MessagesPage.module.css';

export function MessagesPage() {
  const t = useTranslate();
  const { activeProfile, isViewingDependent } = useActiveProfile();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);

  // Track screen size for responsive layout
  useEffect(() => {
    const handleResize = () => setIsMobileView(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!activeProfile?.id) return;
    
    try {
      const dependentId = isViewingDependent ? activeProfile.id : undefined;
      const fetchedConversations = await api.getConversations(dependentId);
      setConversations(fetchedConversations);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeProfile?.id, isViewingDependent]);

  // Initial load and refresh on profile change
  useEffect(() => {
    setIsLoading(true);
    setSelectedConversation(null);
    loadConversations();
  }, [loadConversations]);

  // Handle conversation selection
  const handleSelectConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
  };

  // Handle new conversation created
  const handleConversationCreated = (conversation: Conversation) => {
    setConversations(prev => {
      // Check if conversation already exists (might be reactivated)
      const existingIndex = prev.findIndex(c => c._id === conversation._id);
      if (existingIndex >= 0) {
        // Replace existing with updated version
        const updated = [...prev];
        updated[existingIndex] = conversation;
        return updated;
      }
      // Add new conversation at the top
      return [conversation, ...prev];
    });
    setSelectedConversation(conversation);
    setIsModalOpen(false);
  };

  // Handle back in mobile view
  const handleBack = () => {
    setSelectedConversation(null);
  };

  // Render header
  const renderHeader = () => (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Link to="/dashboard" className={styles.backButton}>←</Link>
        <h1 className={styles.title}>{t('messages_title')}</h1>
      </div>
      <div className={styles.headerRight} />
    </header>
  );

  // Mobile view: show either list or chat
  if (isMobileView) {
    return (
      <div className={styles.container}>
        {!selectedConversation ? (
          <>
            {renderHeader()}
            <main className={styles.main}>
              <ConversationList
                conversations={conversations}
                selectedId={undefined}
                onSelect={handleSelectConversation}
                onNewConversation={() => setIsModalOpen(true)}
                isLoading={isLoading}
              />
            </main>
          </>
        ) : (
          <ChatWindow
            conversation={selectedConversation}
            onBack={handleBack}
          />
        )}
        
        <NewConversationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onConversationCreated={handleConversationCreated}
          dependentId={isViewingDependent ? activeProfile?.id : undefined}
        />
      </div>
    );
  }

  // Desktop view: split view
  return (
    <div className={styles.container}>
      {renderHeader()}
      
      <main className={styles.main}>
        <div className={styles.splitView}>
          <aside className={styles.sidebar}>
            <ConversationList
              conversations={conversations}
              selectedId={selectedConversation?._id}
              onSelect={handleSelectConversation}
              onNewConversation={() => setIsModalOpen(true)}
              isLoading={isLoading}
            />
          </aside>
          
          <div className={styles.chatArea}>
            {selectedConversation ? (
              <ChatWindow conversation={selectedConversation} />
            ) : (
              <div className={styles.noSelection}>
                <span className={styles.noSelectionIcon}>💬</span>
                <h2>{t('messages_select_conversation')}</h2>
                <p>{t('messages_select_conversation_desc')}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <NewConversationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConversationCreated={handleConversationCreated}
        dependentId={isViewingDependent ? activeProfile?.id : undefined}
      />
    </div>
  );
}

