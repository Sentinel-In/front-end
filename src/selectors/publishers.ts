import type { Blackboard } from '../types';

export function evidenceByPublisher(blackboard: Blackboard): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const source of blackboard.sources) {
    counts[source.publisher] = (counts[source.publisher] || 0) + 1;
  }
  return counts;
}

export function evidenceByAuthorityClass(blackboard: Blackboard): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const source of blackboard.sources) {
    counts[source.authority_class] = (counts[source.authority_class] || 0) + 1;
  }
  return counts;
}
