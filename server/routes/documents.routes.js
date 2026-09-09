import express from 'express';
import multer from 'multer';
import { uploadDocuments, listDocuments, deleteDocument } from '../controllers/documents.controller.js';
import { config } from '../config.js';

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024,
    files: config.maxFiles,
  },
});

router.post('/upload', upload.array('files'), uploadDocuments);
router.get('/', listDocuments);
router.delete('/:id', deleteDocument);

export default router;
