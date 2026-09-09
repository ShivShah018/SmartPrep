import { test, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SAMPLES = join(__dirname, '..', '..', 'samples');

// Mock the Gemini service so the full pipeline can be verified without an API key.
// The canned output intentionally omits some optional fields to prove that zod
// coercion + defaults work and malformed AI output cannot reach the response.
mock.module('../services/gemini.service.js', {
  namedExports: {
    analyzeWithGemini: async () => ({
      topics: [
        {
          name: 'Stack operations',
          frequency: 3,
          totalPapers: 3,
          papers: ['CS301-2022.txt', 'CS301-2023.txt', 'CS301-2024.txt'],
          importance: 'high',
          questionPatterns: ['Push/pop algorithm questions'],
          reason: 'Appears in all three papers.',
        },
        {
          name: 'Binary search',
          frequency: 3,
          totalPapers: 3,
          papers: ['CS301-2022.txt', 'CS301-2023.txt', 'CS301-2024.txt'],
          importance: 'high',
          questionPatterns: ['Algorithm + complexity analysis'],
          reason: 'Asked every year.',
        },
        {
          name: 'Hashing',
          frequency: 1,
          totalPapers: 3,
          papers: ['CS301-2022.txt'],
          importance: 'low',
          questionPatterns: [],
          reason: 'Mentioned rarely.',
        },
      ],
      questionPatterns: [
        { pattern: 'Explain a stack and its operations', frequency: 3, examples: ['Explain the concept of a stack.', 'What is a stack?'] },
        { pattern: 'Binary search algorithm and complexity', frequency: 3, examples: ['Write an algorithm for binary search.'] },
      ],
      preparationOrder: [
        { topic: 'Stack operations', priority: 1, reason: 'Appears in 3/3 papers.' },
        { topic: 'Binary search', priority: 2, reason: 'Consistent yearly coverage.' },
        { topic: 'Hashing', priority: 3, reason: 'Rarely tested.' },
      ],
    }),
  },
});

const { default: app } = await import('../app.js');

let server;
let baseUrl;

before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  server?.close();
});

test('health endpoint reports status', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.data.status, 'ok');
});

test('rejects unsupported file types', async () => {
  const form = new FormData();
  form.append('papers', new Blob(['not a real doc'], { type: 'application/json' }), 'notes.json');
  const res = await fetch(`${baseUrl}/api/analysis`, { method: 'POST', body: form });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.success, false);
  assert.match(body.error.message, /Unsupported file type/);
});

test('full flow: multi-paper upload -> extraction -> analysis -> structured response', async () => {
  const form = new FormData();
  for (const name of ['CS301-2022.txt', 'CS301-2023.txt', 'CS301-2024.txt']) {
    const buf = readFileSync(join(SAMPLES, name));
    form.append('papers', new Blob([buf], { type: 'text/plain' }), name);
  }
  form.append('subjectName', 'Data Structures');
  form.append('courseName', 'CS301');

  const res = await fetch(`${baseUrl}/api/analysis`, { method: 'POST', body: form });
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.success, true);

  const { data } = body;

  // Summary
  assert.equal(data.summary.papersUploaded, 3);
  assert.equal(data.summary.papersAnalyzed, 3);
  assert.equal(data.summary.papersFailed, 0);
  assert.ok(data.summary.questionsDetected >= 3 * 8);

  // Papers preserve boundaries + per-paper status
  assert.equal(data.papers.length, 3);
  for (const paper of data.papers) {
    assert.equal(paper.status, 'ok');
    assert.equal(paper.questions.length, 8);
    assert.match(paper.name, /CS301-\d{4}\.txt/);
  }

  // Topics validated
  assert.equal(data.topics.length, 3);
  const stackTopic = data.topics.find((t) => t.name === 'Stack operations');
  assert.equal(stackTopic.importance, 'high');
  assert.ok(Array.isArray(stackTopic.papers));

  // Patterns
  assert.equal(data.questionPatterns.length, 2);
  assert.ok(data.questionPatterns[0].examples.length > 0);

  // Prep order ranked
  assert.equal(data.preparationOrder[0].priority, 1);
});

test('failing papers are reported, not dropped', async () => {
  const form = new FormData();
  const buf = readFileSync(join(SAMPLES, 'CS301-2022.txt'));
  form.append('papers', new Blob([buf], { type: 'text/plain' }), 'good.txt');
  form.append('papers', new Blob([new Uint8Array([1, 2, 3, 4])], { type: 'application/pdf' }), 'corrupt.pdf');

  const res = await fetch(`${baseUrl}/api/analysis`, { method: 'POST', body: form });
  assert.equal(res.status, 200);

  const { data } = await res.json();
  assert.equal(data.summary.papersUploaded, 2);
  assert.equal(data.summary.papersAnalyzed, 1);
  assert.equal(data.summary.papersFailed, 1);

  const failed = data.papers.find((p) => p.status === 'failed');
  assert.equal(failed.name, 'corrupt.pdf');
  assert.ok(failed.error);
});

test('no papers at all is a 400', async () => {
  const form = new FormData();
  const res = await fetch(`${baseUrl}/api/analysis`, { method: 'POST', body: form });
  assert.equal(res.status, 400);
});