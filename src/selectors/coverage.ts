import type { Blackboard, CoverageVector } from '../types';

export function compositeCoverage(blackboard: Blackboard): number {
  const { coverage } = blackboard;
  const values = Object.values(coverage);
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
}

export function weakestDimension(blackboard: Blackboard): { dimension: keyof CoverageVector; value: number } {
  const { coverage } = blackboard;
  let weakestDim: keyof CoverageVector = 'identity';
  let minVal = 101;

  for (const [key, value] of Object.entries(coverage)) {
    if (value < minVal) {
      minVal = value;
      weakestDim = key as keyof CoverageVector;
    }
  }

  return { dimension: weakestDim, value: minVal };
}

export function coverageByDimension(blackboard: Blackboard): { dimension: string; value: number }[] {
  const { coverage } = blackboard;
  return Object.entries(coverage).map(([dimension, value]) => ({ dimension, value }));
}
