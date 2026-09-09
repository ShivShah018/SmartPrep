import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const JSON_DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Memory/JSON fallback state
let fallbackDb = {
  documents: [],
  document_chunks: [],
  conversations: [],
  messages: [],
};

if (fs.existsSync(JSON_DB_PATH)) {
  try {
    fallbackDb = JSON.parse(fs.readFileSync(JSON_DB_PATH, 'utf-8'));
  } catch (e) {
    console.warn('Could not parse local db.json fallback, starting fresh.');
  }
}

function saveFallbackDb() {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(fallbackDb, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save fallback DB:', e);
  }
}

let mysqlPool = null;
let isMysqlActive = false;

export async function initDatabase() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';
  const database = process.env.MYSQL_DATABASE || 'smartprep';
  const port = Number(process.env.MYSQL_PORT || 3306);

  try {
    // Try connecting to MySQL
    const tempConnection = await mysql.createConnection({ host, user, password, port });
    await tempConnection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
    await tempConnection.end();

    mysqlPool = mysql.createPool({
      host,
      user,
      password,
      database,
      port,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    // Run Table DDL
    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) DEFAULT 'default-user',
        original_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(100),
        file_size INT,
        total_pages INT DEFAULT 1,
        total_chunks INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id VARCHAR(64) PRIMARY KEY,
        document_id VARCHAR(64) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        page_number INT DEFAULT 1,
        chunk_index INT NOT NULL,
        chunk_text TEXT NOT NULL,
        embedding JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_doc_id (document_id)
      );
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(64) PRIMARY KEY,
        user_id VARCHAR(64) DEFAULT 'default-user',
        title VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(64) PRIMARY KEY,
        conversation_id VARCHAR(64) NOT NULL,
        sender VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        mode VARCHAR(20) DEFAULT 'rag',
        sources JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conv_id (conversation_id)
      );
    `);

    isMysqlActive = true;
    console.log('✅ Connected to MySQL database successfully.');
  } catch (err) {
    console.log(`ℹ️ MySQL connection unconfigured or unavailable (${err.message}). Using resilient local JSON store.`);
    isMysqlActive = false;
  }
}

// Unified Database Access Layer
export const db = {
  isMysql: () => isMysqlActive,

  // Documents
  async saveDocument(doc) {
    if (isMysqlActive) {
      await mysqlPool.query(
        `INSERT INTO documents (id, user_id, original_name, mime_type, file_size, total_pages, total_chunks) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [doc.id, doc.userId || 'default-user', doc.originalName, doc.mimeType, doc.fileSize, doc.totalPages, doc.totalChunks]
      );
    } else {
      fallbackDb.documents.push({
        id: doc.id,
        user_id: doc.userId || 'default-user',
        original_name: doc.originalName,
        mime_type: doc.mimeType,
        file_size: doc.fileSize,
        total_pages: doc.totalPages,
        total_chunks: doc.totalChunks,
        created_at: new Date().toISOString(),
      });
      saveFallbackDb();
    }
  },

  async getDocuments(userId = 'default-user') {
    if (isMysqlActive) {
      const [rows] = await mysqlPool.query(`SELECT * FROM documents WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
      return rows;
    }
    return fallbackDb.documents.filter(d => d.user_id === userId);
  },

  async deleteDocument(id) {
    if (isMysqlActive) {
      await mysqlPool.query(`DELETE FROM document_chunks WHERE document_id = ?`, [id]);
      await mysqlPool.query(`DELETE FROM documents WHERE id = ?`, [id]);
    } else {
      fallbackDb.documents = fallbackDb.documents.filter(d => d.id !== id);
      fallbackDb.document_chunks = fallbackDb.document_chunks.filter(c => c.document_id !== id);
      saveFallbackDb();
    }
  },

  // Chunks & Embeddings
  async saveChunks(chunks) {
    if (chunks.length === 0) return;
    if (isMysqlActive) {
      for (const c of chunks) {
        await mysqlPool.query(
          `INSERT INTO document_chunks (id, document_id, document_name, page_number, chunk_index, chunk_text, embedding) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [c.id, c.documentId, c.documentName, c.pageNumber, c.chunkIndex, c.chunkText, JSON.stringify(c.embedding)]
        );
      }
    } else {
      for (const c of chunks) {
        fallbackDb.document_chunks.push({
          id: c.id,
          document_id: c.documentId,
          document_name: c.documentName,
          page_number: c.pageNumber,
          chunk_index: c.chunkIndex,
          chunk_text: c.chunkText,
          embedding: c.embedding,
        });
      }
      saveFallbackDb();
    }
  },

  async getAllChunks(documentIds = null) {
    if (isMysqlActive) {
      let query = `SELECT id, document_id, document_name, page_number, chunk_index, chunk_text, embedding FROM document_chunks`;
      const params = [];
      if (documentIds && documentIds.length > 0) {
        query += ` WHERE document_id IN (?)`;
        params.push(documentIds);
      }
      const [rows] = await mysqlPool.query(query, params);
      return rows.map(r => ({
        ...r,
        documentId: r.document_id,
        documentName: r.document_name,
        pageNumber: r.page_number,
        chunkIndex: r.chunk_index,
        chunkText: r.chunk_text,
        embedding: typeof r.embedding === 'string' ? JSON.parse(r.embedding) : r.embedding,
      }));
    } else {
      let chunks = fallbackDb.document_chunks;
      if (documentIds && documentIds.length > 0) {
        chunks = chunks.filter(c => documentIds.includes(c.document_id));
      }
      return chunks.map(c => ({
        id: c.id,
        documentId: c.document_id,
        documentName: c.document_name,
        pageNumber: c.page_number,
        chunkIndex: c.chunk_index,
        chunkText: c.chunk_text,
        embedding: c.embedding,
      }));
    }
  },

  // Conversations
  async createConversation(id, title, userId = 'default-user') {
    const conv = { id, user_id: userId, title, created_at: new Date().toISOString() };
    if (isMysqlActive) {
      await mysqlPool.query(`INSERT INTO conversations (id, user_id, title) VALUES (?, ?, ?)`, [id, userId, title]);
    } else {
      fallbackDb.conversations.unshift(conv);
      saveFallbackDb();
    }
    return conv;
  },

  async getConversations(userId = 'default-user') {
    if (isMysqlActive) {
      const [rows] = await mysqlPool.query(`SELECT * FROM conversations WHERE user_id = ? ORDER BY created_at DESC`, [userId]);
      return rows;
    }
    return fallbackDb.conversations.filter(c => c.user_id === userId);
  },

  async deleteConversation(id) {
    if (isMysqlActive) {
      await mysqlPool.query(`DELETE FROM messages WHERE conversation_id = ?`, [id]);
      await mysqlPool.query(`DELETE FROM conversations WHERE id = ?`, [id]);
    } else {
      fallbackDb.conversations = fallbackDb.conversations.filter(c => c.id !== id);
      fallbackDb.messages = fallbackDb.messages.filter(m => m.conversation_id !== id);
      saveFallbackDb();
    }
  },

  // Messages
  async saveMessage(msg) {
    if (isMysqlActive) {
      await mysqlPool.query(
        `INSERT INTO messages (id, conversation_id, sender, content, mode, sources) VALUES (?, ?, ?, ?, ?, ?)`,
        [msg.id, msg.conversationId, msg.sender, msg.content, msg.mode || 'rag', JSON.stringify(msg.sources || [])]
      );
    } else {
      fallbackDb.messages.push({
        id: msg.id,
        conversation_id: msg.conversationId,
        sender: msg.sender,
        content: msg.content,
        mode: msg.mode || 'rag',
        sources: msg.sources || [],
        created_at: new Date().toISOString(),
      });
      saveFallbackDb();
    }
  },

  async getMessages(conversationId) {
    if (isMysqlActive) {
      const [rows] = await mysqlPool.query(`SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC`, [conversationId]);
      return rows.map(r => ({
        ...r,
        conversationId: r.conversation_id,
        sources: typeof r.sources === 'string' ? JSON.parse(r.sources) : r.sources,
      }));
    }
    return fallbackDb.messages
      .filter(m => m.conversation_id === conversationId)
      .map(m => ({
        id: m.id,
        conversationId: m.conversation_id,
        sender: m.sender,
        content: m.content,
        mode: m.mode,
        sources: m.sources,
        created_at: m.created_at,
      }));
  }
};
