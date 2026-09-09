import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';

// Simple deterministic fallback vector generator for offline/testing mode
function generateFallbackEmbedding(text, dimensions = 768) {
  const hashStr = text.toLowerCase();
  const vector = new Array(dimensions).fill(0);
  for (let i = 0; i < hashStr.length; i++) {
    const charCode = hashStr.charCodeAt(i);
    const idx = (charCode * 31 + i) % dimensions;
    vector[idx] += 1.0;
  }
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0)) || 1.0;
  return vector.map(v => v / magnitude);
}

/**
 * Generates vector embedding using Gemini embedding model (gemini-embedding-001 / gemini-embedding-2 / text-embedding-004).
 * Output is normalized to a 768-dimensional float array for database vector storage.
 *
 * @param {string} text
 * @returns {Promise<number[]>} Array of 768 floating point embedding values
 */
export async function generateEmbedding(text) {
  if (!text || !text.trim()) {
    return new Array(768).fill(0);
  }

  if (!config.geminiApiKey) {
    return generateFallbackEmbedding(text);
  }

  const embeddingModels = ['gemini-embedding-001', 'gemini-embedding-2', 'text-embedding-004'];

  for (const modelName of embeddingModels) {
    try {
      const genAI = new GoogleGenerativeAI(config.geminiApiKey);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(text);
      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        let values = result.embedding.values;
        // Project / truncate to 768 dimensions for storage consistency
        if (values.length !== 768) {
          if (values.length > 768) {
            values = values.slice(0, 768);
          } else {
            values = [...values, ...new Array(768 - values.length).fill(0)];
          }
        }
        // Normalize vector to unit length
        const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0)) || 1.0;
        return values.map(v => v / norm);
      }
    } catch (err) {
      console.warn(`[SmartPrep Gemini] Embedding model "${modelName}" unavailable (${err.message}). Trying fallback...`);
    }
  }

  return generateFallbackEmbedding(text);
}

/**
 * Generates embeddings for an array of text chunks sequentially.
 *
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function generateBatchEmbeddings(texts) {
  const embeddings = [];
  for (const text of texts) {
    const vector = await generateEmbedding(text);
    embeddings.push(vector);
  }
  return embeddings;
}
