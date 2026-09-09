import { useCallback, useRef, useState } from 'react';
import TypewriterStatus from './TypewriterStatus';
import type { AnalysisPhase } from '../types';

const ACCEPTED = '.pdf,.docx,.txt';

interface Props {
  phase: AnalysisPhase;
  error: string | null;
  onAnalyze: (files: File[], subjectName: string, courseName: string) => void;
  onReset: () => void;
}

const ANALYSIS_STATUS_STEPS = [
  'Reading your uploaded papers...',
  'Extracting question blocks...',
  'Identifying recurring topics...',
  'Comparing patterns across papers...',
  'Ranking high-yield topics...',
  'Preparing your analysis...',
];

export default function UploadView({ phase, error, onAnalyze, onReset }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [subjectName, setSubjectName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const busy = phase === 'uploading' || phase === 'processing' || phase === 'analyzing';

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'docx', 'txt'].includes(ext || '');
    });
    setFiles((prev) => {
      const seen = new Set(prev.map((f) => `${f.name}-${f.size}`));
      const unique = incoming.filter((f) => !seen.has(`${f.name}-${f.size}`));
      return [...prev, ...unique];
    });
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const canSubmit = files.length > 0 && !busy;

  return (
    <main className="upload-view">
      <section
        className={`dropzone ${dragOver ? 'drag-over' : ''} ${busy ? 'busy' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
        onClick={() => !busy && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          multiple
          hidden
          disabled={busy}
          onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
        />
        <div className="dropzone-icon">📄</div>
        <h2>Drop your past papers here</h2>
        <p>Upload 2 or more previous examination papers — PDF, DOCX or TXT.</p>
        <button type="button" className="btn btn-primary" disabled={busy} onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
          Choose files
        </button>
      </section>

      {files.length > 0 && (
        <section className="file-list card">
          <div className="file-list-head">
            <h3>Selected papers ({files.length})</h3>
            {!busy && (
              <button type="button" className="btn btn-ghost" onClick={() => setFiles([])}>
                Clear all
              </button>
            )}
          </div>
          <ul>
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`}>
                <span className="file-badge">{f.name.split('.').pop()?.toUpperCase()}</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                {!busy && (
                  <button type="button" className="file-remove" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="meta-form card">
        <h3>Optional context (improves analysis)</h3>
        <div className="meta-row">
          <label>
            <span>Subject name</span>
            <input
              type="text"
              value={subjectName}
              disabled={busy}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Data Structures"
            />
          </label>
          <label>
            <span>Course / code</span>
            <input
              type="text"
              value={courseName}
              disabled={busy}
              onChange={(e) => setCourseName(e.target.value)}
              placeholder="e.g. CS301"
            />
          </label>
        </div>
      </section>

      {busy && (
        <section className="status-bar" role="status">
          <TypewriterStatus steps={ANALYSIS_STATUS_STEPS} />
        </section>
      )}

      {error && (
        <section className="error-banner" role="alert">
          <strong>Analysis failed:</strong> {error}
        </section>
      )}

      {!busy && phase !== 'error' && (
        <div className="actions">
          <button type="button" className="btn btn-primary btn-large" disabled={!canSubmit} onClick={() => onAnalyze(files, subjectName, courseName)}>
            Analyze papers
          </button>
        </div>
      )}

      {phase === 'error' && (
        <div className="actions">
          <button type="button" className="btn btn-primary btn-large" onClick={onReset}>
            Try again
          </button>
        </div>
      )}
    </main>
  );
}