# SmartPrep 🎓

SmartPrep is an AI-powered academic exam preparation and document intelligence platform. It enables students to upload academic course materials—including syllabus documents, lecture notes, textbooks, and past year question papers (PYQs)—and interact with them through grounded AI chat, automated syllabus breakdown, and cross-document exam topic intelligence.

> **Current Status**: **Phase 1** (Core Grounded RAG Chat & Document Pipeline) and **Phase 2** (Syllabus Analyzer, Advanced PYQ Trends & Cross-Document Intelligence) are fully implemented; Phase 3 is planned for future development.

---

## 🌟 Features

### 1. Phase 1 — Core Platform & Grounded RAG
- **Multi-Format Document Ingestion**: Upload academic documents in PDF, DOCX, TXT, and Markdown formats.
- **Page-Aware Text Extraction**: Captures raw text alongside page-level metadata for precise source citation tracing.
- **Sliding-Window Chunking & Vector Embeddings**: Generates 768-dimensional normalized float vectors using Google's `text-embedding-004` model.
- **Semantic Retrieval**: Cosine-similarity top-$k$ search over vector chunks to fetch relevant passages.
- **Deterministic Fast-Path Query Router**: Sub-millisecond ($< 0.1\text{ms}$) classifier that bypasses vector retrieval for general questions (e.g. *"hi"*, *"explain arrays"*).
- **Dual-Mode AI Chat**: Toggle between **General AI Answer** and **Answer from My Documents (RAG)**.
- **Real SSE Streaming**: Low-latency Server-Sent Events streaming powered by `gemini-2.5-flash`.
- **Source Citations**: Page-specific inline citations (`📄 Computer Networks.pdf (Page 42)`) and expandable source cards.
- **Multi-Turn Context**: Preserves dialogue threads in database storage across follow-up queries.

### 2. Phase 2 — Academic Intelligence & Multi-Document Analysis
- **Syllabus Analyzer**: Extracts curriculum units/modules, topic trees, non-guessed weightage tags, and conceptual prerequisites.
- **Advanced PYQ Analyzer**: Splits question papers into individual questions, identifies recurring topics, calculates historical paper frequency ($N/M$ papers), extracts exam year trends (`2022`, `2023`, `2024`), and classifies question types (*Theory*, *Numerical*, *Derivation*, *Diagram*).
- **Cross-Document Intelligence**: Combines evidence across **Syllabus + PYQs + Lecture Notes** to construct a topic coverage vs exam priority matrix (`notesCovered = true` only when topic is found in uploaded notes).
- **Preparation Roadmap**: Generates evidence-backed preparation order rankings (1 to $N$) with reasons.
- **Analysis Persistence**: Stores completed analysis runs in MySQL / JSON storage.

---

## 🛠️ Architecture & Tech Stack

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Custom CSS / Tailwind, Axios, React Markdown, Remark GFM, Lucide React.
- **Backend**: Node.js (>=18), Express.js, Multer, PDF Parse, Mammoth, Zod.
- **AI Models**: Google Gemini API (`@google/generative-ai`) using `gemini-2.5-flash` for generation and `text-embedding-004` for vector embeddings.
- **Database**: Dual-engine architecture supporting MySQL 8+ connection pooling (`mysql2`) and a resilient local JSON fallback (`db.json`).

### System Architecture
```text
Frontend (React 18 + TypeScript + Vite)
   │  ▲ (SSE Stream / REST)
   ▼  │
Backend (Express Server)
   ├── Fast-Path Router (General vs RAG vs Analysis)
   ├── Extractor & Chunker (PDF / DOCX / TXT)
   ├── Vector Embedding Service (text-embedding-004)
   ├── Gemini AI Generation Service (gemini-2.5-flash)
   └── Analysis Engine (Syllabus, PYQ Trends & Cross-Document Matrix)
   │
Database (MySQL Pool / Local JSON Fallback)
   ├── documents & document_chunks
   ├── conversations & messages
   └── analysis_results
```

---

## 📁 Project Structure

```text
SmartPrep/
├── frontend/                # React + TypeScript Vite frontend
│   ├── src/
│   │   ├── api/             # Axios REST & SSE streaming API client
│   │   ├── components/      # UI components (Chat, SyllabusSection, YearTrendsSection, CrossDocMatrixSection, Upload, Dashboard)
│   │   ├── types/           # TypeScript interfaces & definitions
│   │   ├── utils/           # Client-side deterministic router & helpers
│   │   ├── App.tsx          # Root application view management
│   │   └── main.tsx         # React DOM entry point
│   └── package.json
├── server/                  # Node.js Express backend
│   ├── config/              # Database connection & schema initializer
│   ├── controllers/         # REST API route controllers
│   ├── data/                # Local JSON fallback store (db.json)
│   ├── middleware/          # Multer file upload handling
│   ├── prompts/             # Gemini structured prompt templates
│   ├── routes/              # Express API route endpoints
│   ├── schemas/             # Zod validation schemas for Phase 1 & 2
│   ├── services/            # Extraction, chunking, embeddings, retrieval, RAG & analysis services
│   ├── test/                # Fast-path & RAG integration test suites
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

To verify fast-path query routing and SSE streaming:
```bash
cd server
node test/router.test.js
```

---

## 📌 Current Status

Phase 1 and Phase 2 are implemented; Phase 3 is planned for future development.
