import type { Blackboard, AssetMatch, ApplicabilityState } from '../types';

export function assetsByState(blackboard: Blackboard): Record<ApplicabilityState, number> {
  const counts: Record<ApplicabilityState, number> = {
    affected: 0,
    not_affected: 0,
    fixed: 0,
    under_investigation: 0,
    unknown: 0
  };

  for (const asset of blackboard.assets) {
    counts[asset.applicability]++;
  }

  return counts;
}

export function assetImpactRows(blackboard: Blackboard): AssetMatch[] {
  return blackboard.assets;
}

export function unresolvedAssetEvidence(blackboard: Blackboard): AssetMatch[] {
  return blackboard.assets.filter(a => 
    a.applicability === 'under_investigation' || a.applicability === 'unknown'
  );
}
