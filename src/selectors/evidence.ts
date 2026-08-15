import type { Blackboard, Gap, Blocker, Contradiction, Claim, Source, Artifact } from '../types';

export function openGaps(blackboard: Blackboard): Gap[] {
  return blackboard.gaps.filter(g => g.status === 'open');
}

export function openBlockers(blackboard: Blackboard): Blocker[] {
  return blackboard.blockers.filter(b => b.status === 'open');
}

export function openContradictions(blackboard: Blackboard): Contradiction[] {
  return blackboard.contradictions.filter(c => c.status === 'open');
}

export function claimsByAsset(blackboard: Blackboard, assetProduct: string): Claim[] {
  // Matches asset canonical_product to claim scope.product
  return blackboard.claims.filter(c => c.scope.product === assetProduct);
}

export function claimById(blackboard: Blackboard, claimId: string): Claim | undefined {
  return blackboard.claims.find(c => c.claim_id === claimId);
}

export function sourceById(blackboard: Blackboard, sourceId: string): Source | undefined {
  return blackboard.sources.find(s => s.source_id === sourceId);
}

export function artifactById(blackboard: Blackboard, artifactId: string): Artifact | undefined {
  return blackboard.artifacts.find(a => a.artifact_id === artifactId);
}

export function evidenceForClaimIds(blackboard: Blackboard, claimIds: string[]): Claim[] {
  return blackboard.claims.filter(c => claimIds.includes(c.claim_id));
}
