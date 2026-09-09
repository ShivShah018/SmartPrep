import { db } from '../config/database.js';
import { generateEmbedding } from './embedding.service.js';

/**
 * Calculates Cosine Similarity between two float vectors.
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Performs vector similarity retrieval over document chunks.
 *
 * @param {object} params
 * @param {string} params.query User query string
 * @param {string[]} [params.documentIds] Optional filter for specific documents
 * @param {number} [params.topK=4] Number of top relevant chunks to retrieve
 * @param {number} [params.minRelevance=0.25] Similarity threshold for context inclusion
 * @returns {Promise<Array<{chunk: object, score: number}>>}
 */
export async function retrieveRelevantChunks({ query, documentIds = null, topK = 4, minRelevance = 0.25 }) {
  const queryEmbedding = await generateEmbedding(query);
  const chunks = await db.getAllChunks(documentIds);

  if (!chunks || chunks.length === 0) {
    return [];
  }

  const scoredChunks = chunks.map((chunk) => {
    const score = cosineSimilarity(queryEmbedding, chunk.embedding);
    return { chunk, score };
  });

  // Sort by score descending
  scoredChunks.sort((a, b) => b.score - a.score);

  // Filter by minRelevance threshold and take topK
  const relevant = scoredChunks.filter((item) => item.score >= minRelevance).slice(0, topK);

  return relevant;
}
