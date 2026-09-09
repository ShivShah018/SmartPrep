import type { YearTrendItem, QuestionTypeItem } from '../types';

interface Props {
  trends?: YearTrendItem[];
  questionTypes?: QuestionTypeItem[];
}

export default function YearTrendsSection({ trends = [], questionTypes = [] }: Props) {
  if (trends.length === 0 && questionTypes.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>📈 Past Paper Trends</h3>
        <p>Topic appearance frequency and question type breakdown derived from your past year exam papers.</p>
      </div>

      <div className="trends-grid">
        {questionTypes.length > 0 && (
          <div className="card question-types-card">
            <h4>Question Type Breakdown</h4>
            <div className="type-pills">
              {questionTypes.map((qt) => {
                const label = qt.type.charAt(0).toUpperCase() + qt.type.slice(1).toLowerCase();
                return (
                  <div key={qt.type} className="type-stat">
                    <span className="type-name">{label}</span>
                    <span className="type-count">{qt.count} questions ({qt.percentage.toFixed(1)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {trends.length > 0 && (
          <div className="card year-table-card">
            <h4>Year-by-Year Frequency</h4>
            <div className="table-responsive">
              <table className="trends-table">
                <thead>
                  <tr>
                    <th>Topic</th>
                    <th>Yearly Occurrences</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((item) => (
                    <tr key={item.topic}>
                      <td className="font-medium">{item.topic}</td>
                      <td>
                        <div className="year-tags">
                          {Object.entries(item.yearlyCounts).map(([yr, cnt]) => (
                            <span key={yr} className="year-tag">
                              {yr}: <strong>{cnt}</strong>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
