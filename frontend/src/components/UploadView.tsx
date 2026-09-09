import { useRef, useState } from 'react';
import TypewriterStatus from './TypewriterStatus';
import type { AnalysisPhase } from '../types';

const ACCEPTED = '.pdf,.docx,.txt';

interface CategorizedFiles {
  pyqFiles: File[];
  syllabusFiles: File[];
  notesFiles: File[];
}

interface Props {
  phase: AnalysisPhase;
  error: string | null;
  onAnalyze: (data: CategorizedFiles, subjectName: string, courseName: string) => void;
  onReset: () => void;
}

const ANALYSIS_STATUS_STEPS = [
  'Reading your academic documents...',
  'Extracting syllabus units & question blocks...',
  'Cross-referencing syllabus topics against PYQ frequency...',
  'Checking lecture notes coverage...',
  'Calculating year trends & priority rankings...',
  'Preparing your comprehensive analysis...',
];

export default function UploadView({ phase, error, onAnalyze, onReset }: Props) {
  const [pyqFiles, setPyqFiles] = useState<File[]>([]);
  const [syllabusFiles, setSyllabusFiles] = useState<File[]>([]);
  const [notesFiles, setNotesFiles] = useState<File[]>([]);

  const [subjectName, setSubjectName] = useState('');
  const [courseName, setCourseName] = useState('');

  const pyqInputRef = useRef<HTMLInputElement>(null);
  const syllabusInputRef = useRef<HTMLInputElement>(null);
  const notesInputRef = useRef<HTMLInputElement>(null);

  const busy = phase === 'uploading' || phase === 'processing' || phase === 'analyzing';

  const processIncoming = (list: FileList | null): File[] => {
    if (!list) return [];
    return Array.from(list).filter((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase();
      return ['pdf', 'docx', 'txt'].includes(ext || '');
    });
  };

  const handleAddPyqs = (list: FileList | null) => {
    const incoming = processIncoming(list);
    setPyqFiles((prev) => [...prev, ...incoming.filter(f => !prev.some(p => p.name === f.name))]);
  };

  const handleAddSyllabus = (list: FileList | null) => {
    const incoming = processIncoming(list);
    setSyllabusFiles((prev) => [...prev, ...incoming.filter(f => !prev.some(s => s.name === f.name))]);
  };

  const handleAddNotes = (list: FileList | null) => {
    const incoming = processIncoming(list);
    setNotesFiles((prev) => [...prev, ...incoming.filter(f => !prev.some(n => n.name === f.name))]);
  };

  const totalFilesCount = pyqFiles.length + syllabusFiles.length + notesFiles.length;
  const canSubmit = totalFilesCount > 0 && !busy;

  const handleStartAnalysis = () => {
    onAnalyze(
      {
        pyqFiles,
        syllabusFiles,
        notesFiles,
      },
      subjectName,
      courseName
    );
  };

  return (
    <main className="upload-view">
      <div className="upload-header">
        <h2>Build Your Study Workspace</h2>
        <p>Add the materials SmartPrep will use to understand your course.</p>
      </div>

      <div className="upload-dropzones-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Syllabus Category */}
        <section className={`dropzone ${busy ? 'busy' : ''}`} onClick={() => !busy && syllabusInputRef.current?.click()}>
          <input
            ref={syllabusInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            hidden
            disabled={busy}
            onChange={(e) => { handleAddSyllabus(e.target.files); e.target.value = ''; }}
          />
          <div className="dropzone-icon">📚</div>
          <h3>SYLLABUS</h3>
          <p>Course structure, units and topics ({syllabusFiles.length} selected)</p>
          <button type="button" className="btn btn-secondary" disabled={busy}>Browse files</button>
        </section>

        {/* Past Year Questions Category */}
        <section className={`dropzone ${busy ? 'busy' : ''}`} onClick={() => !busy && pyqInputRef.current?.click()}>
          <input
            ref={pyqInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            hidden
            disabled={busy}
            onChange={(e) => { handleAddPyqs(e.target.files); e.target.value = ''; }}
          />
          <div className="dropzone-icon">📝</div>
          <h3>PAST YEAR QUESTIONS</h3>
          <p>Previous exam papers and question banks ({pyqFiles.length} selected)</p>
          <button type="button" className="btn btn-secondary" disabled={busy}>Browse files</button>
        </section>

        {/* Notes & Textbooks Category */}
        <section className={`dropzone ${busy ? 'busy' : ''}`} onClick={() => !busy && notesInputRef.current?.click()}>
          <input
            ref={notesInputRef}
            type="file"
            accept={ACCEPTED}
            multiple
            hidden
            disabled={busy}
            onChange={(e) => { handleAddNotes(e.target.files); e.target.value = ''; }}
          />
          <div className="dropzone-icon">📖</div>
          <h3>NOTES & TEXTBOOKS</h3>
          <p>Lecture notes and study material ({notesFiles.length} selected)</p>
          <button type="button" className="btn btn-secondary" disabled={busy}>Browse files</button>
        </section>
      </div>

      {totalFilesCount > 0 && (
        <section className="file-list card">
          <div className="file-list-head">
            <h3>Selected Materials ({totalFilesCount})</h3>
            {!busy && (
              <button type="button" className="btn btn-ghost" onClick={() => { setPyqFiles([]); setSyllabusFiles([]); setNotesFiles([]); }}>
                Clear all
              </button>
            )}
          </div>
          <ul>
            {syllabusFiles.map((f, i) => (
              <li key={`syl-${f.name}-${i}`}>
                <span className="file-badge" style={{ background: '#10b981', color: '#fff' }}>SYLLABUS</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size" style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Ready</span>
                <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                {!busy && (
                  <button type="button" className="file-remove" onClick={() => setSyllabusFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                )}
              </li>
            ))}
            {pyqFiles.map((f, i) => (
              <li key={`pyq-${f.name}-${i}`}>
                <span className="file-badge" style={{ background: '#3b82f6', color: '#fff' }}>PYQ</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size" style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Ready</span>
                <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                {!busy && (
                  <button type="button" className="file-remove" onClick={() => setPyqFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                )}
              </li>
            ))}
            {notesFiles.map((f, i) => (
              <li key={`notes-${f.name}-${i}`}>
                <span className="file-badge" style={{ background: '#8b5cf6', color: '#fff' }}>NOTES</span>
                <span className="file-name">{f.name}</span>
                <span className="file-size" style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Ready</span>
                <span className="file-size">{(f.size / 1024).toFixed(1)} KB</span>
                {!busy && (
                  <button type="button" className="file-remove" onClick={() => setNotesFiles(prev => prev.filter((_, idx) => idx !== i))}>×</button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="meta-form card">
        <h3>Course Context</h3>
        <div className="meta-row">
          <label>
            <span>Subject name</span>
            <input
              type="text"
              value={subjectName}
              disabled={busy}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="e.g. Data Structures & Algorithms"
            />
          </label>
          <label>
            <span>Course code</span>
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
        <div className="actions" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
          <button type="button" className="btn btn-primary btn-large" disabled={!canSubmit} onClick={handleStartAnalysis}>
            Analyze My Course
          </button>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Connect your syllabus, past papers and notes to understand course structure, topic trends and study gaps.
          </span>
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