/* ============================================================
   App — Router (SPEC-002 Blackboard Pivot)
   ============================================================ */

import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useRoleStore } from './store/useRoleStore';
import { useCaseIndexStore } from './store/useCaseIndexStore';
import {
  DashboardPage,
  AssetImpactReportPage,
  EvidenceExplorerPage,
  GapsPage,
  SettingsPage,
  NotFoundPage,
  ApprovalsPage,
  BoardBriefPage,
  TriagePage,
  LeadTicketsPage,
  EngineerTasksPage,
  RunbookPage,
  HistoryPage,
  AuditTrailPage,
  AlertsPage,
  RecommendationComposer,
} from './pages';
import { ROUTES, withCaseId, type RoutePattern } from './routes';

function RoleLandingRedirect() {
  const config = useRoleStore((s) => s.getConfig());
  return <Navigate to={config.landingRoute} replace />;
}

function CaseRouteRedirect({ route }: { route: RoutePattern }) {
  const fallback = useCaseIndexStore(s => s.cases[0]?.case_id);
  const isLoading = useCaseIndexStore(s => s.isLoading);
  const fetchCases = useCaseIndexStore(s => s.fetchCases);

  useEffect(() => {
    if (!fallback && !isLoading) void fetchCases();
  }, [fallback, fetchCases, isLoading]);

  if (!fallback) {
    return <div style={{ padding: '32px 24px', color: 'var(--color-text-muted)' }}>Resolving case…</div>;
  }
  return <Navigate to={withCaseId(route, fallback)} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Root redirect to role landing */}
          <Route index element={<RoleLandingRedirect />} />

          <Route path={ROUTES.dashboard} element={<DashboardPage />} />
          <Route path={ROUTES.approvals} element={<ApprovalsPage />} />
          <Route path={ROUTES.approvalDetail} element={<ApprovalsPage />} />
          <Route path={ROUTES.brief} element={<BoardBriefPage />} />
          <Route path={ROUTES.briefNew} element={<BoardBriefPage />} />
          <Route path={ROUTES.briefDetail} element={<BoardBriefPage />} />

          <Route path={ROUTES.triage} element={<TriagePage />} />
          <Route path={ROUTES.tickets} element={<LeadTicketsPage />} />
          <Route path={ROUTES.ticketDetail} element={<LeadTicketsPage />} />

          <Route path={ROUTES.tasks} element={<EngineerTasksPage />} />
          <Route path={ROUTES.taskDetail} element={<RunbookPage />} />
          <Route path={ROUTES.history} element={<HistoryPage />} />

          <Route path={ROUTES.audit} element={<CaseRouteRedirect route={ROUTES.auditCase} />} />
          <Route path={ROUTES.auditCase} element={<AuditTrailPage />} />
          <Route path={ROUTES.alerts} element={<AlertsPage />} />
          <Route path={ROUTES.evidence} element={<CaseRouteRedirect route={ROUTES.evidenceCase} />} />
          <Route path={ROUTES.evidenceCase} element={<EvidenceExplorerPage />} />
          <Route path={ROUTES.gaps} element={<CaseRouteRedirect route={ROUTES.gapsCase} />} />
          <Route path={ROUTES.gapsCase} element={<GapsPage />} />
          <Route path={ROUTES.recommendCase} element={<RecommendationComposer />} />
          <Route path={ROUTES.assetImpact} element={<CaseRouteRedirect route={ROUTES.assetImpactCase} />} />
          <Route path={ROUTES.assetImpactCase} element={<AssetImpactReportPage />} />
          <Route path={ROUTES.settings} element={<SettingsPage />} />

          {/* 404 */}
          <Route path={ROUTES.notFound} element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
