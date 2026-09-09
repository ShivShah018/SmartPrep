import type { SyllabusUnit, PrerequisiteItem } from '../types';

interface Props {
  units?: SyllabusUnit[];
  prerequisites?: PrerequisiteItem[];
}

export default function SyllabusSection({ units = [], prerequisites = [] }: Props) {
  if (units.length === 0 && prerequisites.length === 0) return null;

  return (
    <section className="section">
      <div className="section-head">
        <h3>📚 Course Structure</h3>
        <p>Curriculum units, topic breakdowns, and prerequisite concepts derived from your syllabus.</p>
      </div>

      {units.length > 0 && (
        <div className="syllabus-grid">
          {units.map((unit) => (
            <article key={unit.unitNumber} className="card syllabus-card">
              <div className="syllabus-unit-head">
                <span className="unit-badge">Unit {unit.unitNumber}</span>
                <h4>{unit.unitName}</h4>
                {unit.weightage ? (
                  <span className="weightage-pill">{unit.weightage}</span>
                ) : (
                  <span className="weightage-pill neutral">Weightage not specified</span>
                )}
              </div>
              <div className="syllabus-topics-list">
                <strong>Topics included:</strong>
                <ul>
                  {unit.topics.map((t, idx) => (
                    <li key={idx}>{t}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      )}

      {prerequisites.length > 0 && (
        <div className="prerequisites-container card" style={{ marginTop: '1.5rem' }}>
          <h4>Topic Prerequisites</h4>
          <ul className="prereq-list">
            {prerequisites.map((p, idx) => (
              <li key={idx} className="prereq-item">
                <span className="prereq-topic">{p.topic}</span>
                <span className="prereq-arrow">requires</span>
                <span className="prereq-target">{p.prerequisiteTopic}</span>
                <p className="prereq-reason">{p.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
