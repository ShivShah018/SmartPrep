import { useState } from 'react';
import type { PaperStatus } from '../types';

interface Props {
  papers: PaperStatus[];
}

export default function CoverageSection({ papers }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const ok = papers.filter((p) => p.status === 'ok');

  if (ok.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>📄 Uploaded Papers & Questions</h3>
        <p>Questions extracted from your uploaded exam papers used in your course analysis.</p>
      </div>
      <div className="coverage-list">
        {ok.map((paper) => {
          const open = expanded === paper.id;
          return (
            <article key={paper.id} className="coverage-item card">
              <button
                type="button"
                className="coverage-toggle"
                onClick={() => setExpanded(open ? null : paper.id)}
                aria-expanded={open}
              >
                <span className="paper-badge">P{paper.id.replace('paper-', '')}</span>
                <span className="coverage-name">{paper.name}</span>
                <span className="coverage-count">{paper.questions.length} questions</span>
                <span className="coverage-chevron">{open ? '▲' : '▼'}</span>
              </button>
              {open && (
                <ol className="coverage-questions">
                  {paper.questions.map((q, i) => (
                    <li key={i}><span className="q-num">Q{i + 1}</span>{q.question}</li>
                  ))}
                </ol>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}