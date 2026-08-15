import type { Blackboard, Blocker } from '../types';

const PHASES = [
  'dormant', 'discovery', 'expansion', 'reconciliation', 'applicability',
  'actionability', 'verification', 'complete', 'blocked', 'reopened'
];

export function phaseProgress(blackboard: Blackboard): {
  currentPhase: string;
  completedPhases: string[];
  remainingPhases: string[];
} {
  const currentPhase = blackboard.case.derived_phase;
  const currentIndex = PHASES.indexOf(currentPhase);
  
  if (currentIndex === -1) {
    return {
      currentPhase,
      completedPhases: [],
      remainingPhases: []
    };
  }

  return {
    currentPhase,
    completedPhases: PHASES.slice(0, currentIndex),
    remainingPhases: PHASES.slice(currentIndex + 1)
  };
}

export function closureBlockers(blackboard: Blackboard): Blocker[] {
  return blackboard.blockers.filter(b => b.status === 'open' && (b.class === 'closure_blocker' || !b.class));
}
