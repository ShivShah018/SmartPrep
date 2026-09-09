import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import DocumentsView from './components/DocumentsView';
import DashboardView from './components/DashboardView';
import UploadView from './components/UploadView';
import { classifyQueryClient } from './utils/router';
import {
  fetchDocuments,
  uploadDocumentsApi,
  deleteDocumentApi,
  fetchConversationsApi,
  fetchConversationMessagesApi,
  sendChatMessageStreamApi,
  deleteConversationApi,
  uploadAndAnalyze,
} from './api/client';
import type {
  DocumentItem,
  ConversationItem,
  ChatMessage,
  AnalysisPhase,
  AnalysisResult,
} from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents' | 'analysis'>('chat');
  
  // Documents state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  
  // Conversations & Chat state
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Past Paper Analysis state (preserved)
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('idle');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Initial Load: Documents & Conversations
  useEffect(() => {
    loadDocuments();
    loadConversations();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };

  const loadConversations = async () => {
    try {
      const convs = await fetchConversationsApi();
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const handleSelectConversation = async (id: string) => {
    setActiveConversationId(id);
    setActiveTab('chat');
    try {
      const msgs = await fetchConversationMessagesApi(id);
      setMessages(msgs);
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    setMessages([]);
    setActiveTab('chat');
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversationApi(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleUploadDocuments = async (files: File[]) => {
    await uploadDocumentsApi(files);
    await loadDocuments();
  };

  const handleDeleteDocument = async (id: string) => {
    await deleteDocumentApi(id);
    await loadDocuments();
  };

  const handleSendMessage = async (query: string, mode: 'rag' | 'general') => {
    const userTempId = `user-${Date.now()}`;
    const assistantTempId = `assistant-${Date.now()}`;

    // Instant client classification to ensure immediate correct mode badge & status
    const route = classifyQueryClient(query, mode);
    const initialMessageMode: 'rag' | 'general' = route === 'rag' ? 'rag' : 'general';

    const userMsg: ChatMessage = {
      id: userTempId,
      sender: 'user',
      content: query,
      mode: initialMessageMode,
      sources: [],
      createdAt: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: assistantTempId,
      sender: 'assistant',
      content: '',
      mode: initialMessageMode,
      sources: [],
      createdAt: new Date().toISOString(),
      isProcessing: true,
    };

    // 1. Immediately render user message & assistant placeholder with exact mode
    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setIsChatLoading(true);

    // 2. Real-time streaming API call
    await sendChatMessageStreamApi({
      conversationId: activeConversationId || undefined,
      query,
      mode,
      onChunk: (chunkText) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId
              ? {
                  ...m,
                  content: m.content + chunkText,
                  isProcessing: false, // First stream chunk removes status animation immediately
                }
              : m
          )
        );
      },
      onDone: async (res) => {
        if (!activeConversationId && res.conversationId) {
          setActiveConversationId(res.conversationId);
          await loadConversations();
        }
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId
              ? {
                  ...m,
                  id: res.assistantMessage.id || assistantTempId,
                  content: res.assistantMessage.content || m.content,
                  mode: res.assistantMessage.mode || m.mode,
                  sources: res.assistantMessage.sources || [],
                  isProcessing: false,
                }
              : m
          )
        );
        setIsChatLoading(false);
      },
      onError: (err) => {
        console.error('Stream error:', err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantTempId
              ? {
                  ...m,
                  content: m.content || '⚠️ I couldn\'t generate a response right now. Please try again.',
                  sources: [],
                  isProcessing: false,
                }
              : m
          )
        );
        setIsChatLoading(false);
      },
    });
  };

  // Past paper analysis (preserved)
  const handleAnalyze = async (files: File[], subjectName: string, courseName: string) => {
    setAnalysisError(null);
    setAnalysisResult(null);
    setAnalysisPhase('uploading');
    try {
      const data = await uploadAndAnalyze({
        files,
        subjectName,
        courseName,
        onProgress: (p) => setAnalysisPhase(p),
      });
      setAnalysisResult(data);
      setAnalysisPhase('done');
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Something went wrong during analysis.');
      setAnalysisPhase('error');
    }
  };

  const resetAnalysis = () => {
    setAnalysisPhase('idle');
    setAnalysisResult(null);
    setAnalysisError(null);
  };

  return (
    <div className="app-container">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewChat={handleNewChat}
        onDeleteConversation={handleDeleteConversation}
        documents={documents}
      />

      <main className="main-content">
        {activeTab === 'chat' && (
          <ChatView
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            documents={documents}
          />
        )}

        {activeTab === 'documents' && (
          <DocumentsView
            documents={documents}
            onUpload={handleUploadDocuments}
            onDelete={handleDeleteDocument}
          />
        )}

        {activeTab === 'analysis' && (
          <div className="analysis-tab-wrapper">
            {analysisPhase === 'done' && analysisResult ? (
              <DashboardView result={analysisResult} onReset={resetAnalysis} />
            ) : (
              <UploadView
                phase={analysisPhase}
                error={analysisError}
                onAnalyze={handleAnalyze}
                onReset={resetAnalysis}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}