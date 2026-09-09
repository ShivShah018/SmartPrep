import type { Topic } from '../types';
import { importanceLabel, priorityClass } from '../utils/importance';

interface Props {
  topics: Topic[];
}

export default function TopicsSection({ topics }: Props) {
  if (topics.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>High-Yield Topics</h3>
        <p>Concepts that recur across your uploaded papers.</p>
      </div>
      <div className="topic-grid">
        {topics.map((topic) => {
          const pct = topic.totalPapers > 0 ? Math.round((topic.frequency / topic.totalPapers) * 100) : 0;
          return (
            <article key={topic.name} className={`topic-card card priority-${topic.importance}`}>
              <div className="topic-head">
                <h4>{topic.name}</h4>
                <span className={`priority-pill ${priorityClass(topic.importance)}`}>{importanceLabel(topic.importance)}</span>
              </div>

              <div className="topic-metrics">
                <div className="metric">
                  <span className="metric-value">{topic.frequency}</span>
                  <span className="metric-label">of {topic.totalPapers} papers</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{pct}%</span>
                  <span className="metric-label">paper coverage</span>
                </div>
              </div>

              <div className="coverage-bar" aria-label={`${pct}% paper coverage`}>
                <div className={`coverage-fill fill-${topic.importance}`} style={{ width: `${pct}%` }} />
              </div>

              {topic.questionPatterns.length > 0 && (
                <div className="topic-patterns">
                  <strong>Question patterns:</strong>
                  <ul>
                    {topic.questionPatterns.slice(0, 4).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}

              {topic.papers.length > 0 && (
                <div className="topic-papers">
                  <strong>Found in:</strong>{' '}
                  {topic.papers.map((p) => <span key={p} className="paper-chip">{p}</span>)}
                </div>
              )}

              {topic.reason && <p className="topic-reason">{topic.reason}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}