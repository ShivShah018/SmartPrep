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
        <h3>📈 Exam Trends & Question Types</h3>
        <p>Year-over-year topic appearance frequency and exam question type breakdown based on extracted PYQ data.</p>
      </div>

      <div className="trends-grid">
        {questionTypes.length > 0 && (
          <div className="card question-types-card">
            <h4>Question Type Breakdown</h4>
            <div className="type-pills">
              {questionTypes.map((qt) => (
                <div key={qt.type} className="type-stat">
                  <span className="type-name">{qt.type.toUpperCase()}</span>
                  <span className="type-count">{qt.count} questions ({qt.percentage.toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {trends.length > 0 && (
          <div className="card year-table-card">
            <h4>Year-by-Year Frequency Matrix</h4>
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
