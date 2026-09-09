import type { CrossDocumentMatrixItem } from '../types';

interface Props {
  matrix?: CrossDocumentMatrixItem[];
}

export default function CrossDocMatrixSection({ matrix = [] }: Props) {
  if (matrix.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>🔗 Cross-Document Intelligence Matrix</h3>
        <p>Evidence-backed synthesis combining Syllabus Units, Past Exam Frequencies, and Lecture Notes coverage.</p>
      </div>

      <div className="card matrix-card">
        <div className="table-responsive">
          <table className="matrix-table">
            <thead>
              <tr>
                <th>Topic</th>
                <th>Syllabus Unit</th>
                <th>PYQ Frequency</th>
                <th>Lecture Notes Status</th>
                <th>Exam Priority</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((item) => (
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
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
