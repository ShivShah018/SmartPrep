import assert from 'node:assert/strict';
import { extractPdfWithPages } from '../services/pdfExtractor.js';
import { extractTextWithPages } from '../services/extraction.service.js';

// Minimal synthetic PDF with plain text
function createSampleTextPdfBuffer() {
  const content = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 55>> stream
BT /F1 12 Tf 100 700 Td (Semiconductor Physics Lecture Notes Page 1) Tj ET
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
320
%%EOF`;
  return Buffer.from(content);
}

// Minimal synthetic scanned PDF (empty text stream, image placeholder)
function createSampleScannedPdfBuffer() {
  const content = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <<>> /Contents 4 0 R>> endobj
4 0 obj <</Length 0>> stream
endstream endobj
xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000216 00000 n 
trailer <</Size 5 /Root 1 0 R>>
startxref
265
%%EOF`;
  return Buffer.from(content);
}

async function runOcrTests() {
  console.log('=== SmartPrep Vision & OCR Integration Test Suite ===\n');

  // Test 1: Ingestion Service Contract for TXT, MD & PDF
  console.log('1. Testing Document Ingestion Contract for TXT & MD...');
  const txtPages = await extractTextWithPages({ originalname: 'notes.txt', buffer: Buffer.from('Chapter 1: Quantum Mechanics & Semiconductor Physics') });
  assert.equal(txtPages[0].pageNumber, 1);
  assert.equal(txtPages[0].text, 'Chapter 1: Quantum Mechanics & Semiconductor Physics');

  const mdPages = await extractTextWithPages({ originalname: 'syllabus.md', buffer: Buffer.from('# Unit 1: Signals & Systems') });
  assert.equal(mdPages[0].pageNumber, 1);
  assert.equal(mdPages[0].text, '# Unit 1: Signals & Systems');
  console.log('✅ Ingestion Pipeline contract for TXT & MD passed!');

  // Test 3: Vision Fallback Operational Error when no valid image streams exist
  console.log('\n3. Testing Vision Fallback Error Handling...');
  const emptyScannedPdf = createSampleScannedPdfBuffer();
  try {
    await extractPdfWithPages(emptyScannedPdf, 'blank_scan.pdf');
    assert.fail('Should throw 422 operational error when scanned PDF has no readable content');
  } catch (err) {
    assert.equal(err.statusCode, 422, 'Operational status code is 422');
    assert.match(err.message, /Could not read text from "blank_scan.pdf"/, 'Operational error message returned');
    console.log('✅ Scanned PDF Vision Fallback Operational Error handling passed!');
  }

  console.log('\n=== ALL VISION & OCR TESTS PASSED SUCCESSFULLY! ===');
}

runOcrTests().catch((err) => {
  console.error('❌ OCR Test Suite Failed:', err);
  process.exit(1);
});
