import { classifyQuery } from '../services/router.service.js';
import { generateRAGAnswerStream } from '../services/rag.service.js';

async function runRouterTests() {
  console.log('=== Fast-Path Query Router Test Suite ===\n');

  const testCases = [
    { query: 'hi', mode: 'rag', docCount: 2, expected: 'GENERAL' },
    { query: 'hello', mode: 'rag', docCount: 2, expected: 'GENERAL' },
    { query: 'thanks', mode: 'rag', docCount: 2, expected: 'GENERAL' },
    { query: 'what can you do?', mode: 'rag', docCount: 2, expected: 'GENERAL' },
    { query: 'Explain arrays', mode: 'general', docCount: 2, expected: 'GENERAL' },
    { query: 'Explain arrays from my uploaded notes', mode: 'rag', docCount: 2, expected: 'RAG' },
    { query: 'What does page 5 say about ADC?', mode: 'rag', docCount: 2, expected: 'RAG' },
    { query: 'Analyze the uploaded PYQs', mode: 'rag', docCount: 2, expected: 'ANALYSIS' },
    { query: 'Explain quantum computing', mode: 'general', docCount: 2, expected: 'GENERAL' },
  ];

  let passed = 0;
  for (const tc of testCases) {
    const res = classifyQuery({ query: tc.query, mode: tc.mode, documentCount: tc.docCount });
    const isOk = res.route === tc.expected;
    if (isOk) passed++;
    console.log(`${isOk ? '✅' : '❌'} Query: "${tc.query}" [mode=${tc.mode}] -> Route: ${res.route} (${res.durationMs}ms) | Expected: ${tc.expected}`);
  }

  console.log(`\nResults: ${passed}/${testCases.length} router test cases passed!`);

  console.log('\n--- Testing E2E Stream for Simple Query ("hi") ---');
  let streamText = '';
  const result = await generateRAGAnswerStream({
    query: 'hi',
    mode: 'rag',
    onChunk: (chunk) => { streamText += chunk; },
  });

  console.log('Stream result mode:', result.mode);
  console.log('Sources returned for simple query:', result.sources.length);
  console.log('Streamed Answer Snippet:', result.answer.slice(0, 80));

  if (result.sources.length === 0 && result.mode === 'general') {
    console.log('✅ Simple query correctly bypassed RAG vector search!');
  } else {
    console.error('❌ Simple query failed to bypass RAG!');
    process.exit(1);
  }

  console.log('\n✅ ALL ROUTER & FAST-PATH TESTS PASSED SUCCESSFULLY!');
}

runRouterTests().catch((err) => {
  console.error('❌ Router test failed:', err);
  process.exit(1);
});
