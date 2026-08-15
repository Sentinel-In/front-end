/* ============================================================
   App — Router (SPEC-002 Blackboard Pivot)
   ============================================================ */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useRoleStore } from './store/useRoleStore';
import {
  DashboardPage,
  AssetImpactReportPage,
  EvidenceExplorerPage,
  CaseTimelinePage,
  GapsPage,
  SettingsPage,
  NotFoundPage,
} from './pages';

function RoleLandingRedirect() {
  const config = useRoleStore((s) => s.getConfig());
  return <Navigate to={config.landingRoute} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Root redirect to role landing */}
          <Route index element={<RoleLandingRedirect />} />

          {/* New SPEC-002 Routes */}
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/reports/asset-impact" element={<AssetImpactReportPage />} />
          <Route path="/evidence" element={<EvidenceExplorerPage />} />
          <Route path="/case" element={<CaseTimelinePage />} />
          <Route path="/gaps" element={<GapsPage />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
