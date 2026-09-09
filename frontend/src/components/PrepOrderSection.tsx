import type { PreparationOrderItem } from '../types';

interface Props {
  order: PreparationOrderItem[];
}

export default function PrepOrderSection({ order }: Props) {
  if (order.length === 0) return null;

  const maxPriority = Math.max(...order.map((o) => o.priority));

  return (
    <section className="section">
      <div className="section-head">
        <h3>Recommended Preparation Order</h3>
        <p>Topics ranked from highest to lowest priority — study first what appears most across papers.</p>
      </div>
      <ol className="prep-order">
        {order.map((item) => (
          <li key={item.topic} className="prep-item card">
            <div className="prep-rank">{item.priority}</div>
            <div className="prep-body">
              <h4>{item.topic}</h4>
              <p>{item.reason}</p>
            </div>
            <div className="prep-meter" aria-hidden="true">
              <div className="prep-meter-fill" style={{ width: `${Math.max(5, Math.round((1 - (item.priority - 1) / maxPriority) * 100))}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}