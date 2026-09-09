import React from 'react';
import type { ConversationItem, DocumentItem } from '../types';

interface SidebarProps {
  activeTab: 'chat' | 'documents' | 'analysis';
  onSelectTab: (tab: 'chat' | 'documents' | 'analysis') => void;
  conversations: ConversationItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  documents: DocumentItem[];
}

export default function Sidebar({
  activeTab,
  onSelectTab,
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  documents,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-logo">⚡</div>
        <div className="brand-text">
          <h2>SmartPrep</h2>
          <span>Academic AI Analyst</span>
        </div>
      </div>

      <button className="new-chat-btn" onClick={onNewChat}>
        <span className="plus-icon">+</span> New Chat
      </button>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => onSelectTab('chat')}
        >
          <span className="nav-icon">💬</span>
          <span className="nav-label">AI Chat & RAG</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'documents' ? 'active' : ''}`}
          onClick={() => onSelectTab('documents')}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-label">Documents & Index</span>
          {documents.length > 0 && (
            <span className="nav-badge">{documents.length}</span>
          )}
        </button>

        <button
          className={`nav-item ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => onSelectTab('analysis')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Past Paper Analysis</span>
        </button>
      </nav>

      {activeTab === 'chat' && (
        <div className="conversation-history">
          <div className="history-header">Recent Chats</div>
          {conversations.length === 0 ? (
            <div className="history-empty">No conversations yet</div>
          ) : (
            <div className="history-list">
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`history-item ${activeConversationId === c.id ? 'active' : ''}`}
                  onClick={() => onSelectConversation(c.id)}
                >
                  <span className="chat-icon">🗨️</span>
                  <span className="chat-title" title={c.title}>
                    {c.title}
                  </span>
                  <button
                    className="delete-chat-btn"
                    title="Delete Chat"
                    onClick={(e) => onDeleteConversation(c.id, e)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="sidebar-footer">
        <div className="system-status">
          <span className="status-dot"></span>
          <span>RAG Pipeline Active</span>
        </div>
      </div>
    </aside>
  );
}
