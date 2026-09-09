import React, { useState, useRef, useEffect } from 'react';
import ChatMessageBubble from './ChatMessageBubble';
import type { ChatMessage, DocumentItem } from '../types';

interface ChatViewProps {
  messages: ChatMessage[];
  onSendMessage: (query: string, mode: 'rag' | 'general') => Promise<void>;
  isLoading: boolean;
  documents: DocumentItem[];
}

export default function ChatView({ messages, onSendMessage, isLoading, documents }: ChatViewProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'rag' | 'general'>('rag');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    const text = query.trim();
    setQuery('');
    onSendMessage(text, mode);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSamplePrompt = (promptText: string) => {
    if (isLoading) return;
    onSendMessage(promptText, mode);
  };

  return (
    <div className="chat-view">
      <div className="chat-header">
        <div className="chat-title-group">
          <h2>AI Study Assistant</h2>
          <span className="doc-count-badge">
            📚 {documents.length} Material(s) Available
          </span>
        </div>

        <div className="mode-toggle-group">
          <button
            type="button"
            className={`mode-btn ${mode === 'rag' ? 'active' : ''}`}
            onClick={() => setMode('rag')}
            title="Search your uploaded study materials for answers"
          >
            <span className="mode-icon">📚</span> Answer from Study Materials
          </button>
          <button
            type="button"
            className={`mode-btn ${mode === 'general' ? 'active' : ''}`}
            onClick={() => setMode('general')}
            title="General academic knowledge model"
          >
            <span className="mode-icon">💡</span> General AI Answer
          </button>
        </div>
      </div>

      {mode === 'rag' && documents.length === 0 && (
        <div className="no-docs-warning">
          ℹ️ No materials uploaded yet. Add notes, syllabus, or past papers in the <strong>Study Materials</strong> page to ask questions based on your course.
        </div>
      )}

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="chat-welcome">
            <div className="welcome-icon">🎓</div>
            <h3>What would you like to study today?</h3>
            <p>Ask questions about your uploaded notes, request explanations, or generate revision points.</p>

            <div className="sample-prompts">
              <button
                className="sample-prompt-chip"
                onClick={() => handleSamplePrompt("Explain the core concepts covered in my uploaded materials.")}
              >
                💡 Explain core concepts in my uploaded material
              </button>
              <button
                className="sample-prompt-chip"
                onClick={() => handleSamplePrompt("What are the most important topics to study?")}
              >
                🔥 Find important topics to study
              </button>
              <button
                className="sample-prompt-chip"
                onClick={() => handleSamplePrompt("Summarize the key definitions and formulas.")}
              >
                📝 Summarize key definitions
              </button>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((msg, index) => (
              <ChatMessageBubble
                key={msg.id}
                message={msg}
                isLatestAssistant={index === messages.length - 1 && msg.sender === 'assistant'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="chat-input-area">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === 'rag'
              ? 'Ask any question about your uploaded documents...'
              : 'Ask any general academic query...'
          }
          rows={2}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="send-btn"
          disabled={!query.trim() || isLoading}
        >
          Send ➔
        </button>
      </form>
    </div>
  );
}
