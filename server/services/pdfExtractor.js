import pdfParse from 'pdf-parse';

/**
 * Extracts page-by-page text from a PDF buffer.
 * Retains pageNumber metadata for precise RAG citations.
 */
export async function extractPdfWithPages(buffer) {
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
      });
    }
    return cleanText;
  };

  try {
    const data = await pdfParse(buffer, { pagerender: renderPage });
    if (pages.length === 0) {
      if (data.text && data.text.trim()) {
        return [{ pageNumber: 1, text: data.text.trim() }];
      }
      throw new Error('PDF contained no extractable text (likely scanned or image-only).');
    }
    // Sort pages by page number
    pages.sort((a, b) => a.pageNumber - b.pageNumber);
    return pages;
  } catch (err) {
    // Fallback if custom renderPage failed
    const data = await pdfParse(buffer);
    if (!data.text || !data.text.trim()) {
      throw new Error('PDF contained no extractable text (likely scanned or image-only).');
    }
    const totalPages = data.numpages || 1;
    const fullText = data.text.trim();
    const sliceLen = Math.ceil(fullText.length / totalPages);
    const result = [];
    for (let p = 0; p < totalPages; p++) {
      const pageText = fullText.slice(p * sliceLen, (p + 1) * sliceLen).trim();
      if (pageText) {
        result.push({ pageNumber: p + 1, text: pageText });
      }
    }
    return result.length > 0 ? result : [{ pageNumber: 1, text: fullText }];
  }
}