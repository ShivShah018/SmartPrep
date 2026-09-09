export type Importance = 'high' | 'medium' | 'low';

export interface SyllabusUnit {
  unitNumber: number;
  unitName: string;
  topics: string[];
  weightage: string | null;
}

export interface PrerequisiteItem {
  topic: string;
  prerequisiteTopic: string;
  reason: string;
}

export interface YearTrendItem {
  topic: string;
  yearlyCounts: Record<string, number>;
}

export interface QuestionTypeItem {
  type: 'theory' | 'numerical' | 'derivation' | 'diagram' | 'other';
  count: number;
  percentage: number;
}

export interface CrossDocumentMatrixItem {
  topic: string;
  unitName: string | null;
  pyqFrequency: number;
  totalPapers: number;
  notesCovered: boolean;
  notesSources: Array<{ documentName: string; pageNumber: number }>;
  status: 'high-priority' | 'gap' | 'covered' | 'low-yield';
}

export interface Topic {
  name: string;
  unitName?: string | null;
  frequency: number;
  totalPapers: number;
  papers: string[];
  importance: Importance;
  questionPatterns: string[];
  reason: string;
}

export interface QuestionPattern {
  pattern: string;
  type?: 'theory' | 'numerical' | 'derivation' | 'diagram' | 'other';
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
  year?: string | null;
  questions: Array<{ question: string }>;
}

export interface AnalysisSummary {
  papersUploaded: number;
  papersAnalyzed: number;
  papersFailed: number;
  syllabusDocsCount?: number;
  notesDocsCount?: number;
  questionsDetected: number;
  topicsDetected: number;
  repeatedPatternsDetected: number;
  unitsDetected?: number;
}

export interface AnalysisResult {
  summary: AnalysisSummary;
  papers: PaperStatus[];
  syllabusUnits?: SyllabusUnit[];
  prerequisites?: PrerequisiteItem[];
  topics: Topic[];
  questionPatterns: QuestionPattern[];
  yearTrends?: YearTrendItem[];
  questionTypes?: QuestionTypeItem[];
  crossDocumentMatrix?: CrossDocumentMatrixItem[];
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