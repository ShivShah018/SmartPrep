import { AppError } from '../utils/errors.js';
import { extractPdfWithPages } from './pdfExtractor.js';
import { extractDocx } from './docxExtractor.js';

const getExtension = (filename = '') => filename.split('.').pop()?.toLowerCase();

/**
 * Extract text from document buffer with page metadata.
 * Returns array of objects: [{ pageNumber: 1, text: "..." }, ...]
 */
export async function extractTextWithPages({ originalname, buffer }) {
  const ext = getExtension(originalname);

  try {
    switch (ext) {
      case 'pdf':
        return await extractPdfWithPages(buffer);
      case 'docx': {
        const text = await extractDocx(buffer);
        return [{ pageNumber: 1, text: text.trim() }];
      }
      case 'txt':
      case 'md': {
        const text = buffer.toString('utf-8');
        return [{ pageNumber: 1, text: text.trim() }];
      }
      default:
        throw new AppError(`Unsupported file format ".${ext}". Please upload PDF, DOCX, TXT, or MD files.`, 400);
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(`Could not read text from "${originalname}": ${err.message}`, 422);
  }
}

/**
 * Backward compatible single-string text extraction for existing analysis service
 */
export async function extractText(file) {
  const pages = await extractTextWithPages(file);
  return pages.map(p => p.text).join('\n\n');
}