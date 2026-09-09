import type { AnalysisResult } from '../types';
import SummaryStats from './SummaryStats';
import SyllabusSection from './SyllabusSection';
import TopicsSection from './TopicsSection';
import PatternsSection from './PatternsSection';
import YearTrendsSection from './YearTrendsSection';
import CrossDocMatrixSection from './CrossDocMatrixSection';
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
        <h2>Course Analysis</h2>
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          Re-analyze course
        </button>
      </div>

      <SummaryStats summary={result.summary} papers={result.papers} />
      <SyllabusSection units={result.syllabusUnits} prerequisites={result.prerequisites} />
      <CrossDocMatrixSection matrix={result.crossDocumentMatrix} />
      <TopicsSection topics={result.topics} />
      <PatternsSection patterns={result.questionPatterns} />
      <YearTrendsSection trends={result.yearTrends} questionTypes={result.questionTypes} />
      <PrepOrderSection order={result.preparationOrder} />
      <CoverageSection papers={result.papers} />
    </main>
  );
}