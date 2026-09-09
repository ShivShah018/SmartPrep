import type { QuestionPattern } from '../types';

interface Props {
  patterns: QuestionPattern[];
}

export default function PatternsSection({ patterns }: Props) {
  if (patterns.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>Repeated Question Patterns</h3>
        <p>Similar questions that keep showing up — often the same concept in different words.</p>
      </div>
      <div className="pattern-list">
        {patterns.map((pat, i) => (
          <article key={i} className="pattern-card card">
            <div className="pattern-head">
              <span className="pattern-rank">#{i + 1}</span>
              <p className="pattern-desc">{pat.pattern}</p>
              <span className="pattern-freq">
                {pat.frequency} {pat.frequency === 1 ? 'occurrence' : 'occurrences'}
              </span>
            </div>
            {pat.examples.length > 0 && (
              <ul className="pattern-examples">
                {pat.examples.slice(0, 4).map((ex, j) => (
                  <li key={j}>“{ex}”</li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}