import pdfParse from 'pdf-parse';
import { performVisionOcrForPdf } from './ocr.service.js';

/**
 * Extracts page-by-page text from a PDF buffer.
 * Retains pageNumber metadata for precise RAG citations.
 * Automatically falls back to Gemini Vision OCR for handwritten or scanned PDFs.
 */
export async function extractPdfWithPages(buffer, filename = 'document.pdf') {
  const pages = [];

  const renderPage = async function(pageData) {
    const textContent = await pageData.getTextContent();
    let lastY, text = '';
    for (const item of textContent.items) {
      if (lastY === item.transform[5] || !lastY) {
        text += item.str + ' ';
      } else {
        text += '\n' + item.str;
      }
      lastY = item.transform[5];
    }
    const cleanText = text.trim();
    if (cleanText) {
      pages.push({
        pageNumber: pageData.pageIndex + 1,
        text: cleanText,
        extractionMethod: 'text',
      });
    }
    return cleanText;
  };

  try {
    const data = await pdfParse(buffer, { pagerender: renderPage });

    const totalTextLength = pages.reduce((sum, p) => sum + p.text.length, 0);

    // 1. Normal Text PDF: If text is extracted, return pages directly (Fast Path)
    if (pages.length > 0 && totalTextLength > 0) {
      pages.sort((a, b) => a.pageNumber - b.pageNumber);
      return pages;
    }

    // 2. Fallback text check
    if (data.text && data.text.trim().length > 0) {
      const totalPages = data.numpages || 1;
      const fullText = data.text.trim();
      const sliceLen = Math.ceil(fullText.length / totalPages);
      const result = [];
      for (let p = 0; p < totalPages; p++) {
        const pageText = fullText.slice(p * sliceLen, (p + 1) * sliceLen).trim();
        if (pageText) {
          result.push({ pageNumber: p + 1, text: pageText, extractionMethod: 'text' });
        }
      }
      if (result.length > 0) return result;
    }

    // 3. Scanned / Handwritten PDF: No text found -> Invoke Vision OCR Fallback!
    return await performVisionOcrForPdf(buffer, filename);
  } catch (err) {
    try {
      return await performVisionOcrForPdf(buffer, filename);
    } catch (visionErr) {
      throw visionErr;
    }
  }
}