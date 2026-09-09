/**
 * Server-side fast query router (< 0.1ms execution time).
 * Classifies query into: 'GENERAL' | 'RAG' | 'ANALYSIS' without calling any LLM.
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

export function classifyQuery({ query, mode = 'rag' }) {
  const t0 = Date.now();
  const trimmed = (query || '').trim().toLowerCase();

  // 1. General AI mode is ALWAYS GENERAL
  if (mode === 'general') {
    return { route: 'GENERAL', durationMs: Date.now() - t0 };
  }

  // 2. Exact match for casual greetings & acknowledgements
  if (GREETINGS_AND_CASUAL.has(trimmed)) {
    return { route: 'GENERAL', durationMs: Date.now() - t0 };
  }

  // 3. Short casual queries without document keywords (e.g. "hi there", "thanks a lot")
  if (trimmed.length < 15) {
    const hasDocKeyword = RAG_EXPLICIT_KEYWORDS.some(kw => trimmed.includes(kw));
    if (!hasDocKeyword) {
      return { route: 'GENERAL', durationMs: Date.now() - t0 };
    }
  }

  // 4. Check Analysis keywords
  const hasAnalysis = ANALYSIS_KEYWORDS.some(kw => trimmed.includes(kw));
  if (hasAnalysis) {
    return { route: 'ANALYSIS', durationMs: Date.now() - t0 };
  }

  // 5. Check explicit RAG keywords
  const hasRagKeyword = RAG_EXPLICIT_KEYWORDS.some(kw => trimmed.includes(kw));
  if (hasRagKeyword) {
    return { route: 'RAG', durationMs: Date.now() - t0 };
  }

  // 6. Default general academic query (e.g. "explain arrays", "what is a binary tree?")
  return { route: 'GENERAL', durationMs: Date.now() - t0 };
}
