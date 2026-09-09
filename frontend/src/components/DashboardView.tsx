import type { AnalysisResult } from '../types';
import SummaryStats from './SummaryStats';
import TopicsSection from './TopicsSection';
import PatternsSection from './PatternsSection';
import PrepOrderSection from './PrepOrderSection';
import CoverageSection from './CoverageSection';

interface Props {
  result: AnalysisResult;
  onReset: () => void;
}

export default function DashboardView({ result, onReset }: Props) {
  return (
    <main className="dashboard">
      <div className="dashboard-toolbar">
        <h2>Preparation Analysis</h2>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Analyze new papers
        </button>
      </div>

      <SummaryStats summary={result.summary} papers={result.papers} />
      <TopicsSection topics={result.topics} />
      <PatternsSection patterns={result.questionPatterns} />
      <PrepOrderSection order={result.preparationOrder} />
      <CoverageSection papers={result.papers} />
    </main>
  );
}