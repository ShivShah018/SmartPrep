import { GoogleGenerativeAI } from '@google/generative-ai';
import pdfParse from 'pdf-parse';
import { config } from '../config.js';
import { AppError } from '../utils/errors.js';

const FALLBACK_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

const OCR_PROMPT = `You are SmartPrep's academic vision assistant.
Transcribe all visible content from this document page faithfully.

Instructions:
1. Transcribe printed text, handwritten notes, headings, subheadings, bullet points, numbered lists, and tables.
2. Preserve mathematical formulas, equations, symbols, circuit notations, and academic terminology accurately.
3. Transcribe diagram labels and text within figures if visible.
4. If handwriting or a word is unreadable or obscured, write "[unclear]" instead of guessing or inventing content.
5. Do NOT summarize or explain the page. Provide a clean, faithful transcription of the visible academic text.`;

/**
 * Scans a PDF buffer and extracts raw embedded JPEG image buffers.
 * Filters out small logos and scanner watermarks (< 15KB).
 */
export function extractJpegsFromPdfBuffer(buffer) {
  const jpegs = [];
  let i = 0;
  while (i < buffer.length - 3) {
    if (buffer[i] === 0xFF && buffer[i + 1] === 0xD8 && buffer[i + 2] === 0xFF) {
      const start = i;
      i += 3;
      while (i < buffer.length - 1) {
        if (buffer[i] === 0xFF && buffer[i + 1] === 0xD9) {
          const end = i + 2;
          const jpegBuffer = buffer.subarray(start, end);
          if (jpegBuffer.length > 15000) { // Filter out small icons/watermarks (<15KB)
            jpegs.push(jpegBuffer);
          }
          i = end;
          break;
        }
        i++;
      }
    } else {
      i++;
    }
  }
  return jpegs;
}

/**
 * Transcribes a single page image buffer using Gemini Vision API with model fallback.
 */
export async function transcribePageImage(imageBuffer, mimeType = 'image/jpeg') {
  if (!config.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is not configured on the server.', 500);
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const base64Data = imageBuffer.toString('base64');

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const primary = config.geminiModel ? config.geminiModel.split('/').pop() : 'gemini-3.5-flash-lite';
  const modelsToTry = [primary, ...FALLBACK_MODELS.filter((m) => m !== primary)];
  let lastErr = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([OCR_PROMPT, imagePart]);
      const text = result.response.text().trim();
      if (text) {
        return text;
      }
    } catch (err) {
      console.warn(`[SmartPrep Vision OCR] Model "${modelName}" failed for page image (${err.message}). Retrying fallback model...`);
      lastErr = err;
    }
  }

  if (lastErr) {
    throw lastErr;
  }
  return '';
}

/**
 * OCR Fallback for scanned or handwritten PDFs when normal text extraction yields no readable content.
 */
export async function performVisionOcrForPdf(buffer, filename = 'document.pdf') {
  console.log(`[SmartPrep Vision OCR] Invoking handwritten/scanned PDF fallback for "${filename}"...`);

  // 1. Stream-based JPEG extraction (Pure JS, zero DOM/Image dependency)
  const rawJpegs = extractJpegsFromPdfBuffer(buffer);
  const pageImageMap = new Map();

  rawJpegs.forEach((imgBuf, idx) => {
    pageImageMap.set(idx + 1, imgBuf);
  });

  // 2. Fallback to PDF.js operator list ONLY if raw stream extraction returned 0 images
  if (pageImageMap.size === 0) {
    try {
      const renderPage = async function(pageData) {
        const pageNum = pageData.pageIndex + 1;
        try {
          const opList = await pageData.getOperatorList();
          for (let i = 0; i < opList.fnArray.length; i++) {
            if ([85, 82, 86].includes(opList.fnArray[i])) {
              const imgName = opList.argsArray[i][0];
              if (imgName && pageData.objs.has(imgName)) {
                const img = pageData.objs.get(imgName);
                if (img && img.data && (img.data.length > 15000 || img.width > 200)) {
                  if (!pageImageMap.has(pageNum)) {
                    pageImageMap.set(pageNum, Buffer.from(img.data));
                  }
                }
              }
            }
          }
        } catch (e) {
          // ignore page error
        }
        return '';
      };
      await pdfParse(buffer, { pagerender: renderPage });
    } catch (e) {
      // ignore
    }
  }

  if (pageImageMap.size === 0) {
    throw new AppError(`We couldn't read this material clearly. Try uploading a clearer scan or higher-quality PDF.`, 422);
  }

  const pages = [];
  const sortedEntries = Array.from(pageImageMap.entries()).sort((a, b) => a[0] - b[0]);

  for (const [pageNum, imgBuf] of sortedEntries) {
    try {
      const transcribedText = await transcribePageImage(imgBuf);
      const cleanText = transcribedText.replace(/\[unclear\]/gi, '').trim();

      // Only accept page if it contains actual readable transcription (not just "[unclear]")
      if (cleanText.length >= 10) {
        pages.push({
          pageNumber: pageNum,
          text: transcribedText,
          extractionMethod: 'vision',
        });
      } else {
        console.warn(`[SmartPrep Vision OCR] Page ${pageNum} of "${filename}" returned insufficient readable text.`);
      }
    } catch (err) {
      console.warn(`[SmartPrep Vision OCR] Failed page ${pageNum} of "${filename}":`, err.message);
    }
  }

  if (pages.length === 0) {
    throw new AppError(`We couldn't read this material clearly. Try uploading a clearer scan or higher-quality PDF.`, 422);
  }

  return pages;
}
