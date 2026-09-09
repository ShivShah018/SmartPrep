import { z } from 'zod';

/**
 * Backend validation for the structured output returned by Gemini.
 * The UI only ever renders data that passes this schema, so arbitrary
 * AI output can never break the dashboard.
 */

export const importanceSchema = z.enum(['high', 'medium', 'low']);

export const topicSchema = z.object({
  name: z.string().min(1).max(200),
  frequency: z.number().int().min(1),
  totalPapers: z.number().int().min(1),
  papers: z.array(z.string().min(1)).default([]),
  importance: importanceSchema,
  questionPatterns: z.array(z.string().min(1)).default([]),
  reason: z.string().min(1).max(1000),
});

export const questionPatternSchema = z.object({
  pattern: z.string().min(1).max(500),
  frequency: z.number().int().min(1),
  examples: z.array(z.string().min(1)).max(8).default([]),
});

export const preparationOrderItemSchema = z.object({
  topic: z.string().min(1).max(200),
  priority: z.number().int().min(1).max(100),
  reason: z.string().min(1).max(1000),
});

export const analysisResultSchema = z.object({
  topics: z.array(topicSchema).max(50).default([]),
  questionPatterns: z.array(questionPatternSchema).max(50).default([]),
  preparationOrder: z.array(preparationOrderItemSchema).max(50).default([]),
});

/** Coerce + validate raw AI output. Throws ZodError when malformed. */
export function validateAnalysis(raw) {
  return analysisResultSchema.parse(raw ?? {});
}