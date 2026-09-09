import { useState } from 'react';
import MarkdownRenderer from './MarkdownRenderer';
import TypewriterStatus from './TypewriterStatus';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
  message: ChatMessage;
  isLatestAssistant?: boolean;
}

const RAG_STATUS_STEPS = [
  'Reading your question...',
  'Searching your study materials...',
  'Finding relevant sections...',
  'Preparing your answer...',
];

const GENERAL_STATUS_STEPS = [
  'Thinking...',
  'Preparing your answer...',
];

export default function ChatMessageBubble({ message }: ChatMessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isProcessing = Boolean(message.isProcessing);
  const [expandedSourceIdx, setExpandedSourceIdx] = useState<number | null>(null);

  const toggleSourceExpand = (idx: number) => {
    setExpandedSourceIdx(expandedSourceIdx === idx ? null : idx);
  };

  return (
    <div className={`message-wrapper ${message.sender}`}>
      <div className="message-avatar">
        {isUser ? '👤' : '🎓'}
      </div>

      <div className="message-content">
        <div className="message-header">
          <span className="sender-name">
            {isUser ? 'You' : 'SmartPrep AI'}
          </span>
          {!isUser && (
            <span className={`mode-pill ${message.mode}`}>
              {message.mode === 'rag' ? '📚 Based on your study materials' : '💡 AI Answer'}
            </span>
          )}
        </div>

        <div className="message-body">
          {isUser ? (
            <p>{message.content}</p>
          ) : isProcessing ? (
            <TypewriterStatus
              steps={message.mode === 'rag' ? RAG_STATUS_STEPS : GENERAL_STATUS_STEPS}
            />
          ) : (
            <MarkdownRenderer content={message.content} />
          )}
        </div>

        {/* Source Citations Section (shown only after processing completes and sources exist) */}
        {!isUser && !isProcessing && message.sources && message.sources.length > 0 && (
          <div className="sources-container">
            <div className="sources-title">
              <span>📚 Sources:</span>
            </div>

            <div className="sources-grid">
              {message.sources.map((src, idx) => {
                const isExpanded = expandedSourceIdx === idx;
                return (
                  <div
                    key={idx}
                    className={`source-card ${isExpanded ? 'expanded' : ''}`}
                    onClick={() => toggleSourceExpand(idx)}
                  >
                    <div className="source-card-header">
                      <div className="source-doc-name" title={src.documentName}>
                        📄 {src.documentName}
                      </div>
                      <span className="expand-icon">{isExpanded ? '▲' : '▼'}</span>
                    </div>

                    <div className="source-meta">
                      <span className="source-page">Page {src.pageNumber}</span>
                    </div>

                    <div className="source-excerpt">
                      {isExpanded ? `"${src.excerpt}"` : `"${src.excerpt.slice(0, 100)}..."`}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
