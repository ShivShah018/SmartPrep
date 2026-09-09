import { extractText } from './extraction.service.js';
import { normalizeText } from './normalize.service.js';
import { splitQuestions } from './questionSplitter.service.js';
import { analyzeWithGemini } from './gemini.service.js';
import { validateAnalysis } from '../schemas/analysis.schema.js';
import { db } from '../config/database.js';
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

function extractYearFromPaper(filename, text) {
  const matchName = filename.match(/\b(20\d{2}|19\d{2})\b/);
  if (matchName) return matchName[1];
  const matchText = text.slice(0, 500).match(/\b(20\d{2}|19\d{2})\b/);
  if (matchText) return matchText[1];
  return null;
}

export async function runAnalysis(fileInput, meta = {}) {
  let pyqFiles = [];
  let syllabusFiles = [];
  let notesFiles = [];

  if (Array.isArray(fileInput)) {
    pyqFiles = fileInput;
  } else if (fileInput && typeof fileInput === 'object') {
    pyqFiles = fileInput.pyqFiles || fileInput.files || [];
    syllabusFiles = fileInput.syllabusFiles || [];
    notesFiles = fileInput.notesFiles || [];
  }

  if (pyqFiles.length === 0 && syllabusFiles.length === 0 && notesFiles.length === 0) {
    throw new AppError('No academic documents were uploaded. Upload at least one PDF, DOCX or TXT file.', 400);
  }

  const papers = [];
  for (const file of pyqFiles) {
    const entry = {
      id: `paper-${papers.length + 1}`,
      name: file.originalname,
      status: 'ok',
      error: null,
      text: '',
      year: null,
      questions: [],
    };

    try {
      const raw = await extractText(file);
      const normalized = normalizeText(raw);
      if (!normalized) throw new Error('Extracted text was empty after normalization.');

      const questions = splitQuestions(normalized);
      if (questions.length === 0) throw new Error('No questions could be detected.');

      entry.text = normalized;
      entry.year = extractYearFromPaper(file.originalname, normalized);
      entry.questions = questions;
    } catch (err) {
      entry.status = 'failed';
      entry.error = err instanceof AppError ? err.message : `Could not process this paper: ${err.message}`;
    }

    papers.push(entry);
  }

  const syllabusDocs = [];
  for (const file of syllabusFiles) {
    try {
      const raw = await extractText(file);
      const normalized = normalizeText(raw);
      if (normalized) {
        syllabusDocs.push({ name: file.originalname, text: normalized });
      }
    } catch (err) {
      console.warn(`Syllabus file "${file.originalname}" failed extraction:`, err.message);
    }
  }

  const notesDocs = [];
  for (const file of notesFiles) {
    try {
      const raw = await extractText(file);
      const normalized = normalizeText(raw);
      if (normalized) {
        notesDocs.push({ name: file.originalname, text: normalized });
      }
    } catch (err) {
      console.warn(`Notes file "${file.originalname}" failed extraction:`, err.message);
    }
  }

  const analyzedPapers = papers.filter((p) => p.status === 'ok');

  if (analyzedPapers.length === 0 && syllabusDocs.length === 0 && notesDocs.length === 0) {
    throw new AppError(
      'None of the uploaded documents could be read. Check that files contain selectable text (not scans).',
      422,
    );
  }

  const rawResult = await analyzeWithGemini(
    {
      papers: analyzedPapers,
      syllabus: syllabusDocs,
      notes: notesDocs,
    },
    meta
  );

  const analysis = validateAnalysis(rawResult);

  const questionsDetected = analyzedPapers.reduce((sum, p) => sum + p.questions.length, 0);

  const result = {
    id: `analysis-${Date.now()}`,
    createdAt: new Date().toISOString(),
    summary: {
      papersUploaded: papers.length,
      papersAnalyzed: analyzedPapers.length,
      papersFailed: papers.filter((p) => p.status === 'failed').length,
      syllabusDocsCount: syllabusDocs.length,
      notesDocsCount: notesDocs.length,
      questionsDetected,
      topicsDetected: analysis.topics.length,
      repeatedPatternsDetected: analysis.questionPatterns.length,
      unitsDetected: analysis.syllabusUnits.length,
    },
    papers,
    syllabusUnits: analysis.syllabusUnits,
    prerequisites: analysis.prerequisites,
    topics: analysis.topics,
    questionPatterns: analysis.questionPatterns,
    yearTrends: analysis.yearTrends,
    questionTypes: analysis.questionTypes,
    crossDocumentMatrix: analysis.crossDocumentMatrix,
    preparationOrder: analysis.preparationOrder,
  };

  try {
    await db.saveAnalysisResult(result);
  } catch (dbErr) {
    console.warn('Failed to save analysis result to database:', dbErr.message);
  }

  return result;
}