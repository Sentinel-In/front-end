/* ============================================================
   SEEDED DEMO DATA — derived from CIAD-2026-0037 by overlay.
   Not real advisories.
   ============================================================ */

import base from '../data/blackboard.json';
import type { Blackboard, Case, Advisory, CoverageVector, ItemStatus, ApplicabilityState } from '../types';

interface CaseOverlay {
  case: Partial<Case>;
  advisory: Partial<Advisory>;
  coverage: Partial<CoverageVector>;
  assetPatches: { asset_id: string; applicability: ApplicabilityState; confidence: number }[];
  statusPatches?: {
    gaps?: Record<string, ItemStatus>;
    blockers?: Record<string, ItemStatus>;
    contradictions?: Record<string, ItemStatus>;
  };
}

export function buildCase(overlay: CaseOverlay): Blackboard {
  // Deep clone to prevent cross-contamination
  const bb = JSON.parse(JSON.stringify(base)) as Blackboard;

  Object.assign(bb.case, overlay.case);
  Object.assign(bb.advisory, overlay.advisory);
  Object.assign(bb.coverage, overlay.coverage);

  overlay.assetPatches.forEach((patch) => {
    const asset = bb.assets.find((a) => a.asset_id === patch.asset_id);
    if (asset) {
      asset.applicability = patch.applicability;
      asset.confidence = patch.confidence;
    }
  });

  if (overlay.statusPatches) {
    if (overlay.statusPatches.gaps) {
      Object.entries(overlay.statusPatches.gaps).forEach(([id, status]) => {
        const item = bb.gaps.find((x) => x.gap_id === id);
        if (item) item.status = status;
      });
    }
    if (overlay.statusPatches.blockers) {
      Object.entries(overlay.statusPatches.blockers).forEach(([id, status]) => {
        const item = bb.blockers.find((x) => x.blocker_id === id);
        if (item) item.status = status;
      });
    }
    if (overlay.statusPatches.contradictions) {
      Object.entries(overlay.statusPatches.contradictions).forEach(([id, status]) => {
        const item = bb.contradictions.find((x) => x.contradiction_id === id);
        if (item) item.status = status;
      });
    }
  }

  return bb;
}

// Ensure the original base case has the right status for the demo (dormant, closed)
const case0037 = buildCase({
  case: { case_id: 'CIAD-2026-0037', status: 'closed', derived_phase: 'complete' },
  advisory: { title: 'Advisory on Emerging Threats Targeting Microsoft 365 (M365)', publisher_claims: ['CERT-In severity: Critical'] },
  coverage: { applicability: 40 },
  assetPatches: [
    { asset_id: 'asset-entra-tenant-prod', applicability: 'under_investigation', confidence: 0.5 },
    { asset_id: 'asset-m365-tenant-prod', applicability: 'under_investigation', confidence: 0.5 },
  ],
});

const case0041 = buildCase({
  case: { case_id: 'CIAD-2026-0041', status: 'open', derived_phase: 'actionability' },
  advisory: { title: 'Urgent: Credential-phishing campaigns targeting cloud collaboration platforms', publisher_claims: ['CERT-In severity: Critical'] },
  coverage: { applicability: 88, identity: 94 },
  assetPatches: [
    { asset_id: 'asset-entra-tenant-prod', applicability: 'affected', confidence: 0.95 },
  ],
});

const case0039 = buildCase({
  case: { case_id: 'CIAD-2026-0039', status: 'open', derived_phase: 'actionability' },
  advisory: { title: 'High-severity OAuth token theft campaign', publisher_claims: ['CERT-In severity: High'] },
  coverage: { applicability: 82, identity: 91 },
  assetPatches: [
    { asset_id: 'asset-entra-tenant-prod', applicability: 'affected', confidence: 0.9 },
  ],
});

const case0044 = buildCase({
  case: { case_id: 'CIAD-2026-0044', status: 'open', derived_phase: 'reconciliation' },
  advisory: { title: 'Critical vulnerability in cloud identity federation', publisher_claims: ['CERT-In severity: Critical'] },
  coverage: { applicability: 35, identity: 71 },
  assetPatches: [
    { asset_id: 'asset-entra-tenant-prod', applicability: 'unknown', confidence: 0.2 },
  ],
});

const case0046 = buildCase({
  case: { case_id: 'CIAD-2026-0046', status: 'closed', derived_phase: 'complete' },
  advisory: { title: 'Medium-severity misconfiguration in M365 sharing settings', publisher_claims: ['CERT-In severity: Medium'] },
  coverage: { applicability: 93, identity: 96 },
  assetPatches: [
    { asset_id: 'asset-entra-tenant-prod', applicability: 'not_affected', confidence: 0.99 },
    { asset_id: 'asset-m365-tenant-prod', applicability: 'not_affected', confidence: 0.99 },
  ],
});

export const seededCases: Blackboard[] = [
  case0041,
  case0039,
  case0037,
  case0044,
  case0046,
];
