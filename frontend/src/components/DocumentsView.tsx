import React, { useState } from 'react';
import type { DocumentItem } from '../types';

interface DocumentsViewProps {
  documents: DocumentItem[];
  onUpload: (files: File[]) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function DocumentsView({ documents, onUpload, onDelete }: DocumentsViewProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFiles(Array.from(e.target.files));
      setUploadError(null);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Document processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="documents-view">
      <div className="view-header">
        <h1>Study Materials</h1>
        <p>Upload your syllabus, past papers, notes, or textbooks to build your personal study workspace.</p>
      </div>

      <div className="upload-card card">
        <h3>Add Study Material</h3>
        <p className="upload-subtitle">Supports PDF, DOCX, TXT, and Markdown files up to 25MB.</p>

        <form onSubmit={handleUploadSubmit} className="upload-form">
          <div className="file-input-wrapper">
            <input
              type="file"
              id="doc-files"
              multiple
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              disabled={isUploading}
            />
            <label htmlFor="doc-files" className="file-drop-label">
              <span className="drop-icon">📁</span>
              <span className="drop-text">
                {selectedFiles.length > 0
                  ? `${selectedFiles.length} file(s) selected`
                  : 'Drag & drop files here or click to browse'}
              </span>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="file-preview-list">
              {selectedFiles.map((f, i) => (
                <div key={i} className="file-preview-chip">
                  <span>📄 {f.name}</span>
                  <span className="chip-size">({formatFileSize(f.size)})</span>
                </div>
              ))}
            </div>
          )}

          {uploadError && <div className="error-banner">{uploadError}</div>}

          <button
            type="submit"
            className="submit-btn btn btn-primary"
            disabled={selectedFiles.length === 0 || isUploading}
          >
            {isUploading ? 'Preparing your study materials...' : 'Add Materials'}
          </button>
        </form>
      </div>

      <div className="indexed-docs-section">
        <h3>Your Study Library ({documents.length})</h3>

        {documents.length === 0 ? (
          <div className="empty-docs-card card" style={{ textAlign: 'center', padding: '36px 20px' }}>
            <div className="empty-icon" style={{ fontSize: '36px', marginBottom: '8px' }}>📚</div>
            <h4 style={{ margin: '0 0 4px 0' }}>Your study library is empty</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
              Upload your syllabus, past papers or notes above to build your study workspace.
            </p>
          </div>
        ) : (
          <div className="docs-grid">
            {documents.map((doc) => (
              <div key={doc.id} className="doc-card card">
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <h4 className="doc-name" title={doc.originalName}>
                    {doc.originalName}
                  </h4>
                  <div className="doc-meta">
                    <span>{doc.totalPages} Page(s)</span> • <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Ready to use</span> • <span>{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
                <button
                  className="doc-delete-btn"
                  onClick={() => onDelete(doc.id)}
                  title="Remove material"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
