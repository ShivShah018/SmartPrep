import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { SYSTEM_PROMPT, buildAnalysisUserContent } from '../prompts/analysis.prompt.js';
import { AppError } from '../utils/errors.js';

function stripJsonFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return JSON.parse(stripJsonFences(text));
    } catch {
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      if (start !== -1 && end > start) {
        return JSON.parse(text.slice(start, end + 1));
      }
      throw new Error('Gemini did not return parseable JSON.');
    }
  }
}

function extractModelName(model) {
  return model ? model.split('/').pop() : 'gemini-3.6-flash';
}

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'];

async function generateStructuredWithFallback(genAI, primaryModelName, contents, schema) {
  const primary = extractModelName(primaryModelName);
  const modelsToTry = [primary, ...FALLBACK_MODELS.filter(m => m !== primary)];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      try {
        const result = await model.generateContent({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.2,
          },
        });
        return result.response.text();
      } catch (schemaErr) {
        const result = await model.generateContent({
          contents,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });
        return result.response.text();
      }
    } catch (err) {
      console.warn(`[SmartPrep Gemini] Model "${modelName}" unavailable or returned error (${err.message}). Retrying with next supported model...`);
      lastError = err;
    }
  }

  throw lastError;
}

export async function analyzeWithGemini(papers, meta = {}) {
  if (!config.geminiApiKey) {
    throw new AppError('GEMINI_API_KEY is not configured on the server.', 500);
  }

  const genAI = new GoogleGenerativeAI(config.geminiApiKey);

  const responseSchema = {
    type: 'object',
    properties: {
      topics: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            frequency: { type: 'integer' },
            totalPapers: { type: 'integer' },
            papers: { type: 'array', items: { type: 'string' } },
            importance: { type: 'string', enum: ['high', 'medium', 'low'] },
            questionPatterns: { type: 'array', items: { type: 'string' } },
            reason: { type: 'string' },
          },
          required: ['name', 'frequency', 'totalPapers', 'papers', 'importance', 'questionPatterns', 'reason'],
        },
      },
      questionPatterns: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            pattern: { type: 'string' },
            frequency: { type: 'integer' },
            examples: { type: 'array', items: { type: 'string' } },
          },
          required: ['pattern', 'frequency', 'examples'],
        },
      },
      preparationOrder: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            topic: { type: 'string' },
            priority: { type: 'integer' },
            reason: { type: 'string' },
          },
          required: ['topic', 'priority', 'reason'],
        },
      },
    },
    required: ['topics', 'questionPatterns', 'preparationOrder'],
  };

  const userContent = buildAnalysisUserContent(papers, meta);

  const text = await generateStructuredWithFallback(
    genAI,
    config.geminiModel,
    [
      { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
      { role: 'user', parts: [{ text: userContent }] },
    ],
    responseSchema
  );

  return parseJson(text);
}