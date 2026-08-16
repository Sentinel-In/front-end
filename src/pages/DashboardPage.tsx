import { BoardBriefPanel } from '../components/layout/BoardBriefPanel';
import { CaseIndexList } from '../components/layout/CaseIndexList';
import { CoverageByDimension } from '../components/charts/CoverageByDimension';
import { EvidenceByPublisher } from '../components/charts/EvidenceByPublisher';
import { PortfolioCharts } from '../components/charts/PortfolioCharts';
import {
  ActiveAlertsPanel,
  AlertTrendCard,
  CoverageDistributionCard,
  ExecutiveMetricStrip,
} from '../components/charts/ExecutiveSignals';
import { useBlackboardStore } from '../store/useBlackboardStore';
import { useCaseParam } from '../hooks/useCaseParam';
import { openGaps, openBlockers } from '../selectors/evidence';

export function DashboardPage() {
  // The executive landing page is anchored to the authoritative fixture case.
  // Case-scoped pages continue to honor their route parameter.
  useCaseParam('CIAD-2026-0037');
  const blackboard = useBlackboardStore((state) => state.blackboard);

  return (
    <div style={{ padding: '28px 24px 48px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>

      <BoardBriefPanel />

      <ExecutiveMetricStrip />

      <ActiveAlertsPanel />

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-[14px]">
        <AlertTrendCard />
        <CoverageDistributionCard />
      </div>

      {/* Evidence state strip */}
      {blackboard && (
        <div className="card" style={{ padding: '14px 22px' }}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            <div className="flex flex-col">
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Open Gaps</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{openGaps(blackboard).length} / {blackboard.gaps.length}</span>
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Blockers</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{openBlockers(blackboard).length} / {blackboard.blockers.length}</span>
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Contradictions</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{blackboard.contradictions.filter(c => c.status === 'open').length} / {blackboard.contradictions.length}</span>
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Claims</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{blackboard.claims.filter(c => c.status === 'accepted').length} / {blackboard.claims.length}</span>
            </div>
            <div className="flex flex-col">
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>Sources</span>
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{blackboard.sources.length}</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 3: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-[14px]">
        <CoverageByDimension />
        <EvidenceByPublisher />
      </div>

      {/* Row 4: PortfolioCharts */}
      <PortfolioCharts />

      {/* Portfolio drill-down */}
      <CaseIndexList />
    </div>
  );
}
