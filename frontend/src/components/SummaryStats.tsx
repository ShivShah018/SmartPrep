import type { AnalysisSummary, PaperStatus } from '../types';

interface Props {
  summary: AnalysisSummary;
  papers: PaperStatus[];
}

export default function SummaryStats({ summary, papers }: Props) {
  const stats = [
    { label: 'Papers analyzed', value: `${summary.papersAnalyzed}/${summary.papersUploaded}` },
    { label: 'Questions detected', value: summary.questionsDetected },
    { label: 'Major topics', value: summary.topicsDetected },
    { label: 'Repeated patterns', value: summary.repeatedPatternsDetected },
  ];

  const failed = papers.filter((p) => p.status === 'failed');

  return (
    <section className="summary-stats">
      {stats.map((s) => (
        <div key={s.label} className="stat-card card">
          <div className="stat-value">{s.value}</div>
          <div className="stat-label">{s.label}</div>
        </div>
      ))}
      {failed.length > 0 && (
        <div className="failed-note card">
          <strong>{failed.length} paper{failed.length > 1 ? 's' : ''} could not be read:</strong>
          <ul>
            {failed.map((p) => (
              <li key={p.id}>
                {p.name} — {p.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}