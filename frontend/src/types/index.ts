export type Importance = 'high' | 'medium' | 'low';

export interface Topic {
  name: string;
  frequency: number;
  totalPapers: number;
  papers: string[];
  importance: Importance;
  questionPatterns: string[];
  reason: string;
}

export interface QuestionPattern {
  pattern: string;
  frequency: number;
  examples: string[];
}

export interface PreparationOrderItem {
  topic: string;
  priority: number;
  reason: string;
}

export interface PaperStatus {
  id: string;
  name: string;
  status: 'ok' | 'failed';
  error: string | null;
  questions: Array<{ question: string }>;
}

export interface AnalysisSummary {
  papersUploaded: number;
  papersAnalyzed: number;
  papersFailed: number;
  questionsDetected: number;
  topicsDetected: number;
  repeatedPatternsDetected: number;
}

export interface AnalysisResult {
  summary: AnalysisSummary;
  papers: PaperStatus[];
  topics: Topic[];
  questionPatterns: QuestionPattern[];
  preparationOrder: PreparationOrderItem[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: { message: string; stack?: string };
}

export type AnalysisPhase = 'idle' | 'uploading' | 'processing' | 'analyzing' | 'done' | 'error';

// RAG & Chat Types
export interface DocumentItem {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  totalPages: number;
  totalChunks: number;
  createdAt: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  createdAt: string;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  pageNumber: number;
  excerpt: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  mode: 'rag' | 'general';
  sources: SourceReference[];
  createdAt: string;
  isProcessing?: boolean;
}