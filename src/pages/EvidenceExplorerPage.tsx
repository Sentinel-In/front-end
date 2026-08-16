/* ============================================================
   Evidence Explorer Page (SPEC-002 Phase D)
   Security Analyst primary workbench.
   ============================================================ */

import { useBlackboardStore } from '../store/useBlackboardStore';
import { Skeleton, Timestamp, ProvenanceChip, DataTable, Tabs, RoleGate } from '../components/primitives';
import { ReinvocationPanel } from '../features/analyst/ReinvocationPanel';
import { ProvenanceGraph } from '../features/analyst/ProvenanceGraph';
import type { Claim, Source, Artifact, Contradiction } from '../types';
import { useCaseParam } from '../hooks/useCaseParam';

export function EvidenceExplorerPage() {
  useCaseParam();
  const blackboard = useBlackboardStore((state) => state.blackboard);
  const isLoading = useBlackboardStore((state) => state.isLoading);
  const isInitialized = blackboard !== null;

  if (!isInitialized || isLoading || !blackboard) {
    return (
      <div style={{ padding: '32px 24px', maxWidth: '1200px', margin: '0 auto' }}>
        <Skeleton variant="row" height="100px" />
        <div style={{ marginTop: '24px' }}>
          <Skeleton variant="card" height="400px" />
        </div>
      </div>
    );
  }

  // --- Claims Table ---
  const claimsColumns = [
    { key: 'claim_id', label: 'Claim ID', sortable: true, render: (r: Claim) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.claim_id}</span> },
    { key: 'predicate', label: 'Predicate', sortable: true },
    { key: 'product', label: 'Scope (Product)', sortable: true, render: (r: Claim) => r.scope.product },
    { key: 'confidence', label: 'Confidence', sortable: true, render: (r: Claim) => `${Math.round(r.confidence * 100)}%` },
    { key: 'status', label: 'Status', sortable: true, render: (r: Claim) => (
      <span style={{ color: r.status === 'accepted' ? 'var(--color-safe)' : 'var(--color-text)' }}>{r.status}</span>
    ) },
    { key: 'provenance', label: 'Provenance', render: (r: Claim) => <ProvenanceChip claimId={r.claim_id} publisher={r.source_scope.publisher} /> },
  ];

  // --- Sources Table ---
  const sourcesColumns = [
    { key: 'source_id', label: 'Source ID', sortable: true, render: (r: Source) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.source_id}</span> },
    { key: 'publisher', label: 'Publisher', sortable: true },
    { key: 'authority_class', label: 'Authority', sortable: true },
    { key: 'http_status', label: 'HTTP', sortable: true, render: (r: Source) => (
      <span style={{ color: r.http_status === 200 ? 'var(--color-safe)' : 'var(--color-warning)' }}>{r.http_status}</span>
    ) },
    { key: 'availability', label: 'Availability', sortable: true },
    { key: 'retrieved_at', label: 'Retrieved', sortable: true, render: (r: Source) => <Timestamp iso={r.retrieved_at} /> },
  ];

  // --- Artifacts Table ---
  const artifactsColumns = [
    { key: 'artifact_id', label: 'Artifact ID', sortable: true, render: (r: Artifact) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.artifact_id}</span> },
    { key: 'media_type', label: 'Media Type', sortable: true },
    { key: 'bytes', label: 'Size (Bytes)', sortable: true, numeric: true },
    { key: 'sha256', label: 'SHA-256 Hash', render: (r: Artifact) => <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--color-text-dim)' }}>{r.sha256}</span> },
  ];

  // --- Contradictions Table ---
  const contradictionsColumns = [
    { key: 'contradiction_id', label: 'ID', sortable: true, render: (r: Contradiction) => <span style={{ fontFamily: 'var(--font-mono)' }}>{r.contradiction_id}</span> },
    { key: 'subject', label: 'Subject', sortable: true },
    { key: 'status', label: 'Status', sortable: true, render: (r: Contradiction) => (
      <span style={{ color: r.status === 'open' ? 'var(--color-warning)' : 'var(--color-safe)' }}>{r.status}</span>
    ) },
    { key: 'materiality', label: 'Materiality', sortable: true },
    { key: 'claims', label: 'Opposing Claims', render: (r: Contradiction) => (
      <div className="flex gap-2">
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 4px', backgroundColor: 'var(--color-surface-2)', borderRadius: '4px' }}>{r.claim_a.source_id}</span>
        <span style={{ color: 'var(--color-text-dim)' }}>vs</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 4px', backgroundColor: 'var(--color-surface-2)', borderRadius: '4px' }}>{r.claim_b.source_id}</span>
      </div>
    ) },
  ];

  const tabItems = [
    { 
      id: 'claims', 
      label: `Claims (${blackboard.claims.length})`, 
      content: (
        <DataTable<Claim>
          columns={claimsColumns}
          data={blackboard.claims}
          rowKey={(r) => r.claim_id}
          emptyMessage="No claims found."
        />
      )
    },
    { 
      id: 'sources', 
      label: `Sources (${blackboard.sources.length})`, 
      content: (
        <DataTable<Source>
          columns={sourcesColumns}
          data={blackboard.sources}
          rowKey={(r) => r.source_id}
          emptyMessage="No sources found."
        />
      )
    },
    { 
      id: 'artifacts', 
      label: `Artifacts (${blackboard.artifacts.length})`, 
      content: (
        <DataTable<Artifact>
          columns={artifactsColumns}
          data={blackboard.artifacts}
          rowKey={(r) => r.artifact_id}
          emptyMessage="No artifacts found."
        />
      )
    },
    { 
      id: 'contradictions', 
      label: `Contradictions (${blackboard.contradictions.length})`, 
      content: (
        <DataTable<Contradiction>
          columns={contradictionsColumns}
          data={blackboard.contradictions}
          rowKey={(r) => r.contradiction_id}
          emptyMessage="No contradictions found."
        />
      )
    },
  ];

  return (
    <div style={{ padding: '32px 24px 48px', maxWidth: '1440px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--color-text)', margin: '0 0 8px' }}>Evidence Explorer</h1>
        <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0, maxWidth: '600px', lineHeight: 1.5 }}>
          Raw data access for Security Analysts. Inspect the underlying graph of claims, extraction methods, and artifacts that construct the blackboard state.
        </p>
      </div>

      <RoleGate capability="canViewRawEvidence">
        <ProvenanceGraph />
        <div className="card" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Tabs items={tabItems} defaultTab="claims" />
        </div>
        <ReinvocationPanel />
      </RoleGate>

    </div>
  );
}
