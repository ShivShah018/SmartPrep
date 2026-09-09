import { v4 as uuidv4 } from 'uuid';

/**
 * Splits document pages into overlapping semantic text chunks.
 *
 * @param {Array<{pageNumber: number, text: string}>} pages
 * @param {object} options
 * @param {string} options.documentId
 * @param {string} options.documentName
 * @param {number} [options.chunkSize=600] Character limit per chunk
 * @param {number} [options.chunkOverlap=100] Character overlap between adjacent chunks
 * @returns {Array<{id: string, documentId: string, documentName: string, pageNumber: number, chunkIndex: number, chunkText: string}>}
 */
export function chunkDocumentPages(pages, { documentId, documentName, chunkSize = 600, chunkOverlap = 100 }) {
  const chunks = [];
  let globalChunkIndex = 0;

  for (const page of pages) {
    const text = (page.text || '').trim();
    if (!text) continue;

    // Split text into paragraphs or sentences
    if (text.length <= chunkSize) {
      chunks.push({
        id: uuidv4(),
        documentId,
        documentName,
        pageNumber: page.pageNumber,
        chunkIndex: globalChunkIndex++,
        chunkText: text,
      });
      continue;
    }

    // Sliding window chunking by character boundary (breaking on space/newline)
    let start = 0;
    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        // Find nearest space or newline to avoid cutting words
        const spaceIdx = text.lastIndexOf(' ', end);
        const newlineIdx = text.lastIndexOf('\n', end);
        const breakIdx = Math.max(spaceIdx, newlineIdx);
        if (breakIdx > start + Math.floor(chunkSize / 2)) {
          end = breakIdx;
        }
      } else {
        end = text.length;
      }

      const chunkText = text.slice(start, end).trim();
      if (chunkText.length > 20) { // filter out trivial whitespace
        chunks.push({
          id: uuidv4(),
          documentId,
          documentName,
          pageNumber: page.pageNumber,
          chunkIndex: globalChunkIndex++,
          chunkText,
        });
      }

      if (end >= text.length) break;
      start = Math.max(start + 1, end - chunkOverlap);
    }
  }

  return chunks;
}
