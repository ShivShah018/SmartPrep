import { v4 as uuidv4 } from 'uuid';
import { db } from '../config/database.js';
import { extractTextWithPages } from '../services/extraction.service.js';
import { chunkDocumentPages } from '../services/chunker.service.js';
import { generateEmbedding } from '../services/embedding.service.js';
import { AppError } from '../utils/errors.js';

export async function uploadDocuments(req, res, next) {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      throw new AppError('No files uploaded. Please upload PDF, DOCX, TXT, or MD files.', 400);
    }

    const processedDocs = [];

    for (const file of files) {
      // Extract pages
      const pages = await extractTextWithPages(file);
      const docId = uuidv4();
      const documentName = file.originalname;

      // Create chunks
      const chunks = chunkDocumentPages(pages, {
        documentId: docId,
        documentName,
        chunkSize: 600,
        chunkOverlap: 100,
      });

      // Generate embeddings for all chunks
      const chunksWithEmbeddings = [];
      for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk.chunkText);
        chunksWithEmbeddings.push({
          ...chunk,
          embedding,
        });
      }

      // Save to Database
      const docRecord = {
        id: docId,
        userId: 'default-user',
        originalName: documentName,
        mimeType: file.mimetype,
        fileSize: file.size,
        totalPages: pages.length,
        totalChunks: chunksWithEmbeddings.length,
      };

      await db.saveDocument(docRecord);
      await db.saveChunks(chunksWithEmbeddings);

      processedDocs.push({
        id: docId,
        originalName: documentName,
        totalPages: pages.length,
        totalChunks: chunksWithEmbeddings.length,
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully processed ${processedDocs.length} document(s).`,
      data: {
        documents: processedDocs,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listDocuments(req, res, next) {
  try {
    const documents = await db.getDocuments('default-user');
    res.json({
      success: true,
      data: {
        documents: documents.map(d => ({
          id: d.id,
          originalName: d.original_name || d.originalName,
          mimeType: d.mime_type || d.mimeType,
          fileSize: d.file_size || d.fileSize,
          totalPages: d.total_pages || d.totalPages,
          totalChunks: d.total_chunks || d.totalChunks,
          createdAt: d.created_at || d.createdAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params;
    await db.deleteDocument(id);
    res.json({
      success: true,
      message: 'Document deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
