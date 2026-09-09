import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config.js';
import { retrieveRelevantChunks } from './retrieval.service.js';
import { classifyQuery } from './router.service.js';

function extractModelName(model) {
  return model ? model.split('/').pop() : 'gemini-3.6-flash';
}

const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash-lite'];

async function generateWithFallbackStream(genAI, primaryModel, contents, onChunk) {
  const primaryName = extractModelName(primaryModel);
  const modelsToTry = [primaryName, ...FALLBACK_MODELS.filter(m => m !== primaryName)];
  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const streamResult = await model.generateContentStream(contents);
      let fullText = '';
      let isFirst = true;
      const tGenStart = Date.now();

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) {
          if (isFirst) {
            const tFirst = Date.now();
            console.log(`[CHAT] gemini_ttft=${tFirst - tGenStart}ms (${modelName})`);
            isFirst = false;
          }
          fullText += text;
          if (onChunk) onChunk(text);
        }
      }
      return fullText;
    } catch (err) {
      console.warn(`[SmartPrep Gemini Stream] Model "${modelName}" failed (${err.message}). Retrying fallback...`);
      lastError = err;
    }
  }
  throw lastError;
}

function buildGroundedPrompt(query, retrievedItems, conversationHistory = []) {
  const contextBlocks = retrievedItems.map((item, i) => {
    return `[SOURCE ${i + 1}] Document: "${item.chunk.documentName}", Page: ${item.chunk.pageNumber}
${item.chunk.chunkText}`;
  }).join('\n\n---\n\n');

  const historyText = conversationHistory.length > 0
    ? conversationHistory.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n')
    : '';

  const systemInstruction = `You are SmartPrep AI — an academic tutor and document analyzer.
Your task is to answer the user's question using ONLY the provided SOURCE MATERIAL EXCERPTS below.

STRICT INSTRUCTIONS:
1. Base your answer strictly on the provided excerpts. Do NOT invent facts, metrics, or details not present in the context.
2. At the end of your answer or within relevant paragraphs, cite the exact source document name and page number (e.g., "📄 Computer Networks.pdf (Page 42)").
3. If the provided excerpts do not contain enough information to answer the question confidently, respond with:
   "I couldn't find enough information in your uploaded material to answer this confidently."
4. Be clear, academic, structured, and easy for students to understand.`;

  let prompt = `${systemInstruction}\n\n`;

  if (historyText) {
    prompt += `PREVIOUS CONVERSATION CONTEXT:\n${historyText}\n\n`;
  }

  prompt += `SOURCE MATERIAL EXCERPTS:\n---\n${contextBlocks}\n---\n\nUSER QUESTION: ${query}`;
  return prompt;
}

function buildGeneralPrompt(query, conversationHistory = []) {
  const historyText = conversationHistory.length > 0
    ? conversationHistory.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.content}`).join('\n')
    : '';

  let prompt = `You are SmartPrep AI — an expert academic tutor.
Answer the user's question with clear, accurate, and structured academic explanations.\n\n`;

  if (historyText) {
    prompt += `PREVIOUS CONVERSATION CONTEXT:\n${historyText}\n\n`;
  }

  prompt += `USER QUESTION: ${query}`;
  return prompt;
}

/**
 * Fast-path query execution with explicit timing logs and zero-RAG overhead for general queries.
 */
export async function generateRAGAnswerStream({ query, documentIds = null, conversationHistory = [], mode = 'rag', onChunk = null }) {
  const t0 = Date.now();

  // 1. Fast-Path Query Classification (< 1ms)
  const classificationResult = classifyQuery({
    query,
    mode,
    documentCount: documentIds ? documentIds.length : 1,
  });

  const activeRoute = classificationResult.route;
  console.log(`[CHAT] route=${activeRoute}`);
  console.log(`[CHAT] classification=${classificationResult.durationMs}ms`);

  let retrievedItems = [];
  let sources = [];

  // 2. Perform RAG Retrieval ONLY if route === 'RAG'
  if (activeRoute === 'RAG') {
    const tRetrieveStart = Date.now();
    retrievedItems = await retrieveRelevantChunks({
      query,
      documentIds,
      topK: 4,
      minRelevance: 0.1,
    });
    const tRetrieveEnd = Date.now();
    console.log(`[CHAT] retrieval=${tRetrieveEnd - tRetrieveStart}ms (${retrievedItems.length} chunks)`);

    sources = retrievedItems.map(item => ({
      documentId: item.chunk.documentId,
      documentName: item.chunk.documentName,
      pageNumber: item.chunk.pageNumber,
      excerpt: item.chunk.chunkText.slice(0, 160) + '...',
      score: Math.round(item.score * 100) / 100,
    }));

    if (retrievedItems.length === 0 && config.geminiApiKey) {
      const insufficientMsg = "I couldn't find enough information in your uploaded material to answer this confidently. You can switch to General AI mode if you would like an answer based on general knowledge.";
      if (onChunk) onChunk(insufficientMsg);
      console.log(`[CHAT] total=${Date.now() - t0}ms`);
      return {
        answer: insufficientMsg,
        mode: 'rag',
        sources: [],
      };
    }
  }

  // Offline / Unconfigured Key Fallback
  if (!config.geminiApiKey) {
    const contextSummary = retrievedItems.map(r => `📄 ${r.chunk.documentName} (Page ${r.chunk.pageNumber}): "${r.chunk.chunkText.slice(0, 120)}..."`).join('\n');
    const answer = activeRoute === 'RAG'
      ? `[SmartPrep Grounded Response]\nBased on your uploaded material:\n\n${contextSummary || 'General academic answer.'}\n\nKey Concepts: The requested query "${query}" relates to your uploaded course topics.`
      : `Hello! I am SmartPrep AI, your academic assistant. How can I help you study today?`;
    if (onChunk) onChunk(answer);
    console.log(`[CHAT] total=${Date.now() - t0}ms`);
    return { answer, mode: activeRoute === 'RAG' ? 'rag' : 'general', sources };
  }

  // 3. Gemini Prompt & Streaming Execution
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const prompt = activeRoute === 'RAG'
    ? buildGroundedPrompt(query, retrievedItems, conversationHistory)
    : buildGeneralPrompt(query, conversationHistory);

  console.log(`[CHAT] gemini_start=0ms`);
  const answer = await generateWithFallbackStream(genAI, config.geminiModel, prompt, onChunk);
  const tEnd = Date.now();

  console.log(`[CHAT] total=${tEnd - t0}ms`);

  return {
    answer,
    mode: activeRoute === 'RAG' ? 'rag' : 'general',
    sources,
  };
}

export async function generateRAGAnswer(params) {
  return generateRAGAnswerStream(params);
}
