import type { CrossDocumentMatrixItem } from '../types';

interface Props {
  matrix?: CrossDocumentMatrixItem[];
}

export default function CrossDocMatrixSection({ matrix = [] }: Props) {
  if (matrix.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>🔗 Course Coverage</h3>
        <p>See how your syllabus topics connect with past questions and your study materials.</p>
      </div>

      <div className="card matrix-card">
        <div className="table-responsive">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Syllabus Unit</th>
                <th>Past Questions</th>
                <th>Notes Coverage</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((item) => {
                const statusLabel = 
                  item.status === 'high-priority' ? 'High Priority' :
                  item.status === 'low-yield' ? 'Low Yield' :
                  item.status === 'covered' ? 'Covered' :
                  'Study Gap';
                return (
                  <tr key={item.topic}>
                    <td className="font-semibold">{item.topic}</td>
                    <td>{item.unitName || 'Unassigned'}</td>
                    <td>
                      <span className="pyq-badge">
                        {item.pyqFrequency} of {item.totalPapers} papers
                      </span>
                    </td>
                    <td>
                      {item.notesCovered ? (
                        <span className="notes-pill covered">
                          ✓ Covered in Notes
                          {item.notesSources.length > 0 && ` (${item.notesSources[0].documentName})`}
                        </span>
                      ) : (
                        <span className="notes-pill missing">⚠️ Missing from Notes</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill status-${item.status}`}>
                        {statusLabel}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
