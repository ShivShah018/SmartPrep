import express from 'express';
import {
  createConversation,
  listConversations,
  getConversation,
  sendMessage,
  sendMessageStream,
  deleteConversation,
} from '../controllers/chat.controller.js';

const router = express.Router();

router.post('/conversations', createConversation);
router.get('/conversations', listConversations);
router.get('/conversations/:id', getConversation);
router.delete('/conversations/:id', deleteConversation);
router.post('/message', sendMessage);
router.post('/stream', sendMessageStream);

export default router;
