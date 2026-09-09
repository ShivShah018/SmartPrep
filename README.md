# SmartPrep 🎓

SmartPrep is an AI-powered academic exam preparation and document intelligence platform. It enables students to upload academic course materials—including syllabus documents, lecture notes, textbooks, and past year question papers (PYQs)—and interact with them through grounded AI chat and automated exam topic analysis.

---

## 🌟 Features

### 1. Document Intelligence & Processing
- **Multi-Format Support**: Upload academic documents in PDF, DOCX, TXT, and Markdown formats.
- **Page-Aware Text Extraction**: Extracts text along with page metadata for accurate citation tracing.
- **Sliding-Window Chunking & Embeddings**: Normalizes text and generates 768-dimensional vector embeddings using Google's `text-embedding-004` model.
- **Semantic Retrieval**: Performs cosine-similarity search over document chunks to fetch top-$k$ relevant passages.

### 2. Dual-Mode AI Chat & Fast-Path Routing
- **Deterministic Fast-Path Router**: Evaluates incoming user queries in $< 0.1\text{ms}$ (0 API calls) to distinguish general conversational queries from document-specific ones.
- **General AI Mode**: Direct streaming responses for general academic queries (e.g., *"Explain arrays"* or *"hi"*) without vector database lookup latency.
- **Document-Grounded RAG Mode**: RAG pipeline triggered when queries reference uploaded materials. Synthesizes answers using retrieved chunks with page-specific citations and expandable source cards.
- **Real-Time SSE Streaming**: Low-latency Server-Sent Events (SSE) streaming powered by `gemini-2.5-flash`.
- **Rich Markdown Support**: Renders headings, tables, bullet lists, inline math, and code blocks with a one-click copy button.
- **Multi-Turn Context**: Stores conversation threads and message history for contextual follow-up questions.

### 3. Exam & PYQ Analysis (Phase 2)
- **Question Extraction**: Automatically splits uploaded past papers into individual exam questions.
- **Topic & Pattern Recognition**: Groups recurring questions, identifies topic frequency, unit distribution, year-wise trends, and question-type patterns.
- **Preparation Priority**: Computes recommended topic learning order based on frequency and syllabus coverage.

---

## 🛠️ Architecture & Tech Stack

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Custom CSS / Tailwind, Axios, React Markdown, Remark GFM, Lucide React.
- **Backend**: Node.js (>=18), Express.js, Multer, PDF Parse, Mammoth, Zod.
- **AI Models**: Google Gemini API (`@google/generative-ai`) using `gemini-2.5-flash` for generation and `text-embedding-004` for vector embeddings.
- **Database**: Dual-engine architecture supporting MySQL 8+ connection pooling (`mysql2`) with automatic schema initialization, and a resilient local JSON database fallback (`db.json`) when MySQL is offline.

### System Architecture
```text
Frontend (React + Vite)
   │  ▲ (SSE Stream / REST)
   ▼  │
Backend (Express Server)
   ├── Fast-Path Router (General vs RAG vs Analysis)
   ├── Extractor & Chunker (PDF / DOCX / TXT)
   ├── Vector Embedding Service (text-embedding-004)
   └── Gemini AI Generation Service (gemini-2.5-flash)
   │
Database (MySQL Pool / Local JSON Fallback)
   ├── documents & document_chunks
   └── conversations & messages
```

---

## 📁 Project Structure

```text
SmartPrep/
├── frontend/                # React + TypeScript Vite frontend
│   ├── src/
│   │   ├── api/             # Axios REST & SSE streaming API client
│   │   ├── components/      # UI components (Chat, Documents, Upload, Analysis)
│   │   ├── types/           # TypeScript interfaces & definitions
│   │   ├── utils/           # Client-side deterministic router & helpers
│   │   ├── App.tsx          # Root application view management
│   │   ├── main.tsx         # React DOM entry point
│   │   └── styles.css       # Design tokens, themes & layout styles
│   └── package.json
├── server/                  # Node.js Express backend
│   ├── config/              # Database connection & schema initializer
│   ├── controllers/         # REST API route controllers
│   ├── data/                # Local JSON fallback store (db.json)
│   ├── middleware/          # Multer file upload handling
│   ├── prompts/             # Gemini structured prompt templates
│   ├── routes/              # Express API route endpoints
│   ├── schemas/             # Zod validation schemas
│   ├── services/            # Extraction, chunking, embeddings, retrieval & RAG services
│   ├── test/                # Fast-path & RAG integration test suites
│   ├── utils/               # Custom error handlers
│   ├── server.js            # Server entry point
│   └── package.json
├── samples/                 # Sample question papers for testing
├── .gitignore               # Ignored files and secrets
└── README.md                # Project documentation
```

---

## ⚙️ Local Setup Instructions

### Prerequisites
- Node.js (>= 18.0.0)
- npm or yarn
- Google Gemini API Key ([Get an API Key](https://aistudio.google.com/apikey))
- *(Optional)* MySQL database server

### 1. Clone the Repository
```bash
git clone https://github.com/ShivShah018/SmartPrep.git
cd SmartPrep
```

### 2. Configure Backend Environment Variables
Create a `.env` file inside the `server/` directory:
```bash
cp server/.env.example server/.env
```
Edit `server/.env` and add your Gemini API Key:
```env
PORT=8000
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
CORS_ORIGIN=http://localhost:5173

# Optional MySQL Configuration (Defaults to JSON storage if omitted/offline)
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=your_password
MYSQL_DATABASE=smartprep
MYSQL_PORT=3306
```

### 3. Install Dependencies & Start Backend
```bash
cd server
npm install
npm run dev
```
The backend server will run on `http://localhost:8000`.

### 4. Install Dependencies & Start Frontend
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The frontend application will run on `http://localhost:5173`.

---

## 🧪 Running Tests

To verify the fast-path query router and end-to-end RAG stream:
```bash
cd server
node test/router.test.js
node test/rag.test.js
```

---

## 📌 Current Status

SmartPrep is an active open-source project. The current repository reflects the complete implementation of **Phase 1** (Core Document Intelligence & Grounded RAG Chat) and **Phase 2** (Past Paper Question Analysis & Syllabus Prioritization).
