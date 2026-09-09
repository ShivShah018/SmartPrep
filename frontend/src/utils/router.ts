/**
 * Client-side fast query router for immediate UI badge and status initialization.
 * Classifies queries into: 'general' | 'rag' | 'analysis' in < 0.1ms.
 */

const GREETINGS_AND_CASUAL = new Set([
  'hi', 'hello', 'hey', 'heya', 'hola', 'greetings',
  'thanks', 'thank you', 'thx', 'ty',
  'ok', 'okay', 'cool', 'great', 'awesome', 'fine',
  'good morning', 'good afternoon', 'good evening', 'good night',
  'who are you', 'who are you?', 'what can you do', 'what can you do?',
  'help', 'help me', 'tell me a joke', 'explain what you can do'
]);

const RAG_EXPLICIT_KEYWORDS = [
  'document', 'documents', 'pdf', 'notes', 'syllabus', 'page', 'chapter',
  'section', 'uploaded', 'file', 'files', 'textbook', 'material',
  'according to', 'from my notes', 'from the document', 'in my notes',
  'in the pdf', 'definition given in', 'from the uploaded', 'my notes',
  'my uploaded', 'my pdf'
];

const ANALYSIS_KEYWORDS = [
  'analyze', 'pyq', 'pyqs', 'past paper', 'past papers', 'repeated question',
  'repeated questions', 'important topics from papers', 'unit-wise frequency',
  'compare syllabus with pyqs'
];

export function classifyQueryClient(query: string, mode: 'rag' | 'general' = 'rag'): 'general' | 'rag' | 'analysis' {
  if (mode === 'general') return 'general';

  const trimmed = (query || '').trim().toLowerCase();

  // 1. Casual greetings & acknowledgements
  if (GREETINGS_AND_CASUAL.has(trimmed)) return 'general';

  // 2. Short queries without explicit document keywords (e.g. "hi there", "thanks a lot")
  if (trimmed.length < 15) {
    const hasDocKeyword = RAG_EXPLICIT_KEYWORDS.some((kw) => trimmed.includes(kw));
    if (!hasDocKeyword) return 'general';
  }

  // 3. Analysis keywords
  const hasAnalysis = ANALYSIS_KEYWORDS.some((kw) => trimmed.includes(kw));
  if (hasAnalysis) return 'analysis';

  // 4. Explicit RAG keywords required for RAG routing
  const hasDocKeyword = RAG_EXPLICIT_KEYWORDS.some((kw) => trimmed.includes(kw));
  if (hasDocKeyword) return 'rag';

  // 5. Default general academic query (e.g., "explain arrays", "what is recursion")
  return 'general';
}
