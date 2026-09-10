import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { extractPdfWithPages } from '../services/pdfExtractor.js';
import { chunkDocumentPages } from '../services/chunker.service.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { generateRAGAnswerStream } from '../services/rag.service.js';

async function testRealHandwrittenPdf() {
  console.log('=== REAL HANDWRITTEN PDF VISION INGESTION & RAG PIPELINE TEST ===\n');

  const realPdfPath = 'C:/Users/SHIVAM/Downloads/Semiconductor ends notes.pdf';
  const pdfName = 'Semiconductor_ends_notes.pdf';

  if (!fs.existsSync(realPdfPath)) {
    throw new Error(`Real handwritten PDF file not found at path: "${realPdfPath}"`);
  }

  const pdfBuffer = fs.readFileSync(realPdfPath);
  console.log(`1. Loaded real handwritten PDF file: "${pdfName}" (${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB)`);

  // STEP 1: Ingestion & Gemini Vision OCR (Zero hardcoded text injection!)
  console.log('2. Running extractPdfWithPages (Fast-path detects no typed text -> triggers Gemini Vision OCR)...');
  const pages = await extractPdfWithPages(pdfBuffer, pdfName);

  // CRITICAL ASSERTIONS
  assert.ok(pages.length > 0, 'Extracted at least 1 page');
  assert.equal(pages[0].extractionMethod, 'vision', 'Extraction method MUST be vision');
  assert.notEqual(pages[0].text.trim(), '[unclear]', 'OCR output MUST NOT be [unclear]');
  assert.ok(pages[0].text.trim().length >= 20, 'OCR output MUST contain readable transcribed text');

  const totalChars = pages.reduce((sum, p) => sum + p.text.length, 0);

  console.log('\n--- OCR RESULT ---');
  console.log(`Method: ${pages[0].extractionMethod}`);
  console.log(`Pages processed: ${pages.length}`);
  console.log(`Characters extracted: ${totalChars}`);
  console.log(`First 500 characters:\n${pages[0].text.slice(0, 500)}\n`);

  // STEP 2: Chunking & 768-dim Vector Embeddings
  console.log('3. Generating sliding-window text chunks & vector embeddings from OCR output...');
  const docId = uuidv4();
  const chunks = chunkDocumentPages(pages, { documentId: docId, documentName: pdfName });
  assert.ok(chunks.length > 0, 'Chunks generated from OCR text');

  // Verify vector chunk text contains the OCR text directly
  assert.equal(chunks[0].chunkText, pages[0].text.slice(0, chunks[0].chunkText.length));

  const chunksWithEmbeddings = [];
  for (const c of chunks.slice(0, 5)) { // Embed first 5 chunks for test speed
    const embedding = await generateEmbedding(c.chunkText);
    chunksWithEmbeddings.push({ ...c, embedding });
  }

  console.log('\n--- VECTOR RESULT ---');
  console.log(`Chunks: ${chunks.length}`);
  console.log(`First chunk text:\n${chunks[0].chunkText.slice(0, 250)}...\n`);

  // STEP 3: Database Storage
  await db.saveDocument({
    id: docId,
    userId: 'default-user',
    originalName: pdfName,
    mimeType: 'application/pdf',
    fileSize: pdfBuffer.length,
    totalPages: pages.length,
    totalChunks: chunks.length,
  });
  await db.saveChunks(chunksWithEmbeddings);

  // STEP 4: RAG Retrieval & Answer Stream
  const query = 'What topics or steps are covered on page 1 of these semiconductor notes?';
  console.log(`4. Running Grounded RAG Query Stream: "${query}"...`);
  let streamedText = '';

  const ragResult = await generateRAGAnswerStream({
    query,
    mode: 'rag',
    onChunk: (text) => {
      streamedText += text;
    },
  });

  // STEP 5: Verification of RAG result and citation
  assert.ok(ragResult.sources.length > 0, 'RAG retrieval returned sources');
  assert.equal(ragResult.sources[0].documentName, pdfName, 'Citation document name matches');
  assert.equal(ragResult.sources[0].pageNumber, pages[0].pageNumber, 'Citation page number matches');

  console.log('\n--- RAG RESULT ---');
  console.log(`Query: ${query}`);
  console.log(`Retrieved excerpt:\n${ragResult.sources[0].excerpt}`);
  console.log(`Answer:\n${streamedText.slice(0, 350)}...\n`);

  console.log('--- CITATION ---');
  console.log(`Document: ${ragResult.sources[0].documentName}`);
  console.log(`Page: ${ragResult.sources[0].pageNumber}\n`);

  console.log('=== REAL HANDWRITTEN PDF VISION INGESTION TEST PASSED 100%! ===');
}

testRealHandwrittenPdf().catch((err) => {
  console.error('❌ E2E Handwritten PDF Test Failed:', err);
  process.exit(1);
});
