import { z } from 'zod';

/**
 * Backend validation for the structured output returned by Gemini.
 * The UI only ever renders data that passes this schema, so arbitrary
 * AI output can never break the dashboard.
 */

export const importanceSchema = z.enum(['high', 'medium', 'low']);

export const syllabusUnitSchema = z.object({
  unitNumber: z.number().int().min(1),
  unitName: z.string().min(1).max(200),
  topics: z.array(z.string().min(1)).default([]),
  weightage: z.string().nullable().default(null),
});

export const prerequisiteSchema = z.object({
  topic: z.string().min(1).max(200),
  prerequisiteTopic: z.string().min(1).max(200),
  reason: z.string().min(1).max(500),
});

export const yearTrendItemSchema = z.object({
  topic: z.string().min(1).max(200),
  yearlyCounts: z.record(z.string(), z.number().int()).default({}),
});

export const questionTypeItemSchema = z.object({
  type: z.enum(['theory', 'numerical', 'derivation', 'diagram', 'other']),
  count: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
});

export const crossDocMatrixItemSchema = z.object({
  topic: z.string().min(1).max(200),
  unitName: z.string().nullable().default(null),
  pyqFrequency: z.number().int().min(0),
  totalPapers: z.number().int().min(0),
  notesCovered: z.boolean().default(false),
  notesSources: z.array(z.object({
    documentName: z.string(),
    pageNumber: z.number().default(1),
  })).default([]),
  status: z.enum(['high-priority', 'gap', 'covered', 'low-yield']),
});

export const topicSchema = z.object({
  name: z.string().min(1).max(200),
  unitName: z.string().nullable().default(null),
  frequency: z.number().int().min(0),
  totalPapers: z.number().int().min(0),
  papers: z.array(z.string().min(1)).default([]),
  importance: importanceSchema,
  questionPatterns: z.array(z.string().min(1)).default([]),
  reason: z.string().min(1).max(1000),
});

export const questionPatternSchema = z.object({
  pattern: z.string().min(1).max(500),
  type: z.enum(['theory', 'numerical', 'derivation', 'diagram', 'other']).default('theory'),
  frequency: z.number().int().min(0),
  examples: z.array(z.string().min(1)).max(8).default([]),
});

export const preparationOrderItemSchema = z.object({
  topic: z.string().min(1).max(200),
  priority: z.number().int().min(1).max(100),
  reason: z.string().min(1).max(1000),
});

export const analysisResultSchema = z.object({
  syllabusUnits: z.array(syllabusUnitSchema).default([]),
  prerequisites: z.array(prerequisiteSchema).default([]),
  topics: z.array(topicSchema).max(50).default([]),
  questionPatterns: z.array(questionPatternSchema).max(50).default([]),
  yearTrends: z.array(yearTrendItemSchema).default([]),
  questionTypes: z.array(questionTypeItemSchema).default([]),
  crossDocumentMatrix: z.array(crossDocMatrixItemSchema).default([]),
  preparationOrder: z.array(preparationOrderItemSchema).max(50).default([]),
});

/** Coerce + validate raw AI output. Throws ZodError when malformed. */
export function validateAnalysis(raw) {
  return analysisResultSchema.parse(raw ?? {});
}