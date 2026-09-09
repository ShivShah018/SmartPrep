import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { generateRAGAnswerStream } from '../services/rag.service.js';
import { AppError } from '../utils/errors.js';

export async function createConversation(req, res, next) {
  try {
    const { title = 'New Conversation' } = req.body;
    const convId = uuidv4();
    const conv = await db.createConversation(convId, title, 'default-user');
    res.status(201).json({
      success: true,
      data: { conversation: conv },
    });
  } catch (err) {
    next(err);
  }
}

export async function listConversations(req, res, next) {
  try {
    const conversations = await db.getConversations('default-user');
    res.json({
      success: true,
      data: {
        conversations: conversations.map(c => ({
          id: c.id,
          title: c.title,
          createdAt: c.created_at || c.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { id } = req.params;
    const messages = await db.getMessages(id);
    res.json({
      success: true,
      data: {
        conversationId: id,
        messages: messages.map(m => ({
          id: m.id,
          sender: m.sender,
          content: m.content,
          mode: m.mode,
          sources: m.sources,
          createdAt: m.created_at || m.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessage(req, res, next) {
  try {
    let { conversationId, query, mode = 'rag', documentIds = null } = req.body;

    if (!query || !query.trim()) {
      throw new AppError('Query text cannot be empty.', 400);
    }

    if (!conversationId) {
      conversationId = uuidv4();
      const title = query.slice(0, 40) + (query.length > 40 ? '...' : '');
      await db.createConversation(conversationId, title, 'default-user');
    }

    const existingMessages = await db.getMessages(conversationId);
    const historyForPrompt = existingMessages.map(m => ({
      sender: m.sender,
      content: m.content,
    }));

    const userMsgId = uuidv4();
    const userMsg = {
      id: userMsgId,
      conversationId,
      sender: 'user',
      content: query.trim(),
      mode,
      sources: [],
    };
    await db.saveMessage(userMsg);

    const aiResponse = await generateRAGAnswerStream({
      query: query.trim(),
      documentIds,
      conversationHistory: historyForPrompt,
      mode,
    });

    const assistantMsgId = uuidv4();
    const assistantMsg = {
      id: assistantMsgId,
      conversationId,
      sender: 'assistant',
      content: aiResponse.answer,
      mode: aiResponse.mode,
      sources: aiResponse.sources,
    };
    await db.saveMessage(assistantMsg);

    res.json({
      success: true,
      data: {
        conversationId,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function sendMessageStream(req, res, next) {
  try {
    let { conversationId, query, mode = 'rag', documentIds = null } = req.body;

    if (!query || !query.trim()) {
      throw new AppError('Query text cannot be empty.', 400);
    }

    if (!conversationId) {
      conversationId = uuidv4();
      const title = query.slice(0, 40) + (query.length > 40 ? '...' : '');
      await db.createConversation(conversationId, title, 'default-user');
    }

    const existingMessages = await db.getMessages(conversationId);
    const historyForPrompt = existingMessages.map(m => ({
      sender: m.sender,
      content: m.content,
    }));

    const userMsgId = uuidv4();
    const userMsg = {
      id: userMsgId,
      conversationId,
      sender: 'user',
      content: query.trim(),
      mode,
      sources: [],
    };
    await db.saveMessage(userMsg);

    // Set Server-Sent Events headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const assistantMsgId = uuidv4();

    // 1. Send metadata SSE event with conversationId and sources placeholder
    let fullAnswer = '';

    const aiResult = await generateRAGAnswerStream({
      query: query.trim(),
      documentIds,
      conversationHistory: historyForPrompt,
      mode,
      onChunk: (chunkText) => {
        fullAnswer += chunkText;
        res.write(`event: chunk\ndata: ${JSON.stringify({ text: chunkText })}\n\n`);
      },
    });

    const assistantMsg = {
      id: assistantMsgId,
      conversationId,
      sender: 'assistant',
      content: aiResult.answer || fullAnswer,
      mode: aiResult.mode,
      sources: aiResult.sources || [],
    };
    await db.saveMessage(assistantMsg);

    res.write(`event: done\ndata: ${JSON.stringify({ conversationId, assistantMessage: assistantMsg })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      next(err);
    } else {
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
  }
}

export async function deleteConversation(req, res, next) {
  try {
    const { id } = req.params;
    await db.deleteConversation(id);
    res.json({
      success: true,
      message: 'Conversation deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
