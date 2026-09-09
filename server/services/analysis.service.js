import { extractText } from './extraction.service.js';
import { normalizeText } from './normalize.service.js';
import { splitQuestions } from './questionSplitter.service.js';
import { analyzeWithGemini } from './gemini.service.js';
import { validateAnalysis } from '../schemas/analysis.schema.js';
import { AppError } from '../utils/errors.js';

/**
 * Orchestrates: upload validation -> per-paper extraction -> normalization
 * -> question splitting -> Gemini analysis -> schema validation.
 *
 * Extraction failures are captured per paper (never silently dropped); failed
 * papers are excluded from AI analysis but still reported to the client.
 */

function buildPaperList(files) {
  return files.map((file, i) => ({
    id: `paper-${i + 1}`,
    originalName: file.originalname,
  }));
}

export async function runAnalysis(files, meta = {}) {
  if (!files || files.length === 0) {
    throw new AppError('No papers were uploaded. Upload at least one PDF, DOCX or TXT file.', 400);
  }

  const papers = [];

  for (const file of files) {
    const entry = {
      id: `paper-${papers.length + 1}`,
      name: file.originalname,
      status: 'ok',
      error: null,
      text: '',
      questions: [],
    };

    try {
      const raw = await extractText(file);
      const normalized = normalizeText(raw);
      if (!normalized) throw new Error('Extracted text was empty after normalization.');

      const questions = splitQuestions(normalized);
      if (questions.length === 0) throw new Error('No questions could be detected.');

      entry.text = normalized;
      entry.questions = questions;
    } catch (err) {
      entry.status = 'failed';
      entry.error = err instanceof AppError ? err.message : `Could not process this paper: ${err.message}`;
    }

    papers.push(entry);
  }

  const analyzedPapers = papers.filter((p) => p.status === 'ok');

  if (analyzedPapers.length === 0) {
    throw new AppError(
      'None of the uploaded papers could be read. Check that PDFs contain selectable text (not scans) and files are not corrupted.',
      422,
    );
  }

  const rawResult = await analyzeWithGemini(analyzedPapers, meta);
  const analysis = validateAnalysis(rawResult);

  const questionsDetected = analyzedPapers.reduce((sum, p) => sum + p.questions.length, 0);

  return {
    summary: {
      papersUploaded: papers.length,
      papersAnalyzed: analyzedPapers.length,
      papersFailed: papers.filter((p) => p.status === 'failed').length,
      questionsDetected,
      topicsDetected: analysis.topics.length,
      repeatedPatternsDetected: analysis.questionPatterns.length,
    },
    papers,
    topics: analysis.topics,
    questionPatterns: analysis.questionPatterns,
    preparationOrder: analysis.preparationOrder,
  };
}