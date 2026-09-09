import axios from 'axios';
import type {
  AnalysisResult,
  ApiResponse,
  DocumentItem,
  ConversationItem,
  ChatMessage,
} from '../types';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 180000,
});

export interface UploadAnalysisParams {
  files: File[];
  subjectName: string;
  courseName: string;
  onProgress?: (phase: 'uploading' | 'processing' | 'analyzing') => void;
}

export async function uploadAndAnalyze({
  files,
  subjectName,
  courseName,
  onProgress,
}: UploadAnalysisParams): Promise<AnalysisResult> {
  const formData = new FormData();
  files.forEach((file) => formData.append('papers', file));
  if (subjectName) formData.append('subjectName', subjectName);
  if (courseName) formData.append('courseName', courseName);

  onProgress?.('uploading');

  const res = await client.post<ApiResponse<AnalysisResult>>('/api/analysis', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: () => onProgress?.('uploading'),
  });

  if (!res.data.success) {
    throw new Error(res.data.error?.message || 'Analysis failed.');
  }

  onProgress?.('analyzing');
  return res.data.data;
}

// Document Management API
export async function fetchDocuments(): Promise<DocumentItem[]> {
  const res = await client.get<ApiResponse<{ documents: DocumentItem[] }>>('/api/documents');
  return res.data.data.documents;
}

export async function uploadDocumentsApi(files: File[]): Promise<DocumentItem[]> {
  const formData = new FormData();
  files.forEach((f) => formData.append('files', f));

  const res = await client.post<ApiResponse<{ documents: DocumentItem[] }>>('/api/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  if (!res.data.success) {
    throw new Error(res.data.error?.message || 'Document upload failed.');
  }
  return res.data.data.documents;
}

export async function deleteDocumentApi(id: string): Promise<void> {
  await client.delete(`/api/documents/${id}`);
}

// Chat API
export async function fetchConversationsApi(): Promise<ConversationItem[]> {
  const res = await client.get<ApiResponse<{ conversations: ConversationItem[] }>>('/api/chat/conversations');
  return res.data.data.conversations;
}

export async function createConversationApi(title?: string): Promise<ConversationItem> {
  const res = await client.post<ApiResponse<{ conversation: ConversationItem }>>('/api/chat/conversations', { title });
  return res.data.data.conversation;
}

export async function fetchConversationMessagesApi(id: string): Promise<ChatMessage[]> {
  const res = await client.get<ApiResponse<{ conversationId: string; messages: ChatMessage[] }>>(`/api/chat/conversations/${id}`);
  return res.data.data.messages;
}

export async function deleteConversationApi(id: string): Promise<void> {
  await client.delete(`/api/chat/conversations/${id}`);
}

export async function sendChatMessageApi(params: {
  conversationId?: string;
  query: string;
  mode?: 'rag' | 'general';
  documentIds?: string[];
}): Promise<{ conversationId: string; userMessage: ChatMessage; assistantMessage: ChatMessage }> {
  const res = await client.post<
    ApiResponse<{ conversationId: string; userMessage: ChatMessage; assistantMessage: ChatMessage }>
  >('/api/chat/message', params);

  if (!res.data.success) {
    throw new Error(res.data.error?.message || 'Failed to generate response.');
  }

  return res.data.data;
}

// Real-Time SSE Stream API
export async function sendChatMessageStreamApi(params: {
  conversationId?: string;
  query: string;
  mode?: 'rag' | 'general';
  documentIds?: string[];
  onChunk: (text: string) => void;
  onDone: (data: { conversationId: string; assistantMessage: ChatMessage }) => void;
  onError: (err: Error) => void;
}): Promise<void> {
  try {
    const response = await fetch('/api/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: params.conversationId,
        query: params.query,
        mode: params.mode || 'rag',
        documentIds: params.documentIds,
      }),
    });

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}: Streaming connection failed.`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const eventStr of events) {
        if (!eventStr.trim()) continue;
        const lines = eventStr.split('\n');
        let eventType = '';
        let dataStr = '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            eventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            dataStr = line.slice(6).trim();
          }
        }

        if (eventType === 'chunk' && dataStr) {
          const parsed = JSON.parse(dataStr);
          params.onChunk(parsed.text);
        } else if (eventType === 'done' && dataStr) {
          const parsed = JSON.parse(dataStr);
          params.onDone(parsed);
        } else if (eventType === 'error' && dataStr) {
          const parsed = JSON.parse(dataStr);
          params.onError(new Error(parsed.message || 'Stream processing failed.'));
        }
      }
    }
  } catch (err) {
    params.onError(err instanceof Error ? err : new Error('Stream error.'));
  }
}