import type { Blackboard, CoverageVector } from '../types';

export type ExecutiveAlertSeverity = 'Critical' | 'High';

export interface ExecutiveAlert {
  id: string;
  severity: ExecutiveAlertSeverity;
  title: string;
  explanation: string;
  destination: 'evidence' | 'gaps';
}

export interface CoverageBand {
  label: string;
  count: number;
  total: number;
  tone: 'critical' | 'medium' | 'safe';
}

/**
 * Executive-safe alerts derived from the materialized blackboard. The copy is
 * deliberately summarized: the executive surface never exposes raw evidence.
 */
export function executiveAlerts(blackboard: Blackboard): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = [];

  blackboard.contradictions
    .filter((item) => item.status === 'open' && item.materiality.toLowerCase().startsWith('high'))
    .forEach((item) => alerts.push({
      id: item.contradiction_id,
      severity: 'Critical',
      title: 'High-materiality contradiction remains open',
      explanation: 'Conflicting evidence must be resolved before it can support an operational decision.',
      destination: 'evidence',
    }));

  blackboard.blockers
    .filter((item) => item.status === 'open')
    .forEach((item) => alerts.push({
      id: item.blocker_id,
      severity: 'High',
      title: item.class === 'missing_private_environmental_evidence'
        ? 'Tenant applicability evidence is blocked'
        : 'Public evidence cannot be independently reproduced',
      explanation: item.effect ?? 'A named external dependency prevents complete evidence collection.',
      destination: 'gaps',
    }));

  Object.entries(blackboard.coverage)
    .filter(([, value]) => value < 60)
    .forEach(([dimension, value]) => alerts.push({
      id: `coverage-${dimension}`,
      severity: 'High',
      title: `${formatDimension(dimension)} coverage is below 60`,
      explanation: `Current evidence coverage is ${value}; uncertainty remains material in this dimension.`,
      destination: 'gaps',
    }));

  return alerts;
}

export function assetsNotEstablished(blackboard: Blackboard): number {
  return blackboard.assets.filter((asset) =>
    asset.version === null
    || asset.configuration === null
    || asset.environmental_match === null
    || asset.applicability === 'under_investigation'
    || asset.applicability === 'unknown'
  ).length;
}

export function coverageDistribution(blackboard: Blackboard): CoverageBand[] {
  const values = Object.values(blackboard.coverage);
  const total = values.length;

  return [
    { label: 'Limited 0–59', count: values.filter((value) => value < 60).length, total, tone: 'critical' },
    { label: 'Developing 60–89', count: values.filter((value) => value >= 60 && value < 90).length, total, tone: 'medium' },
    { label: 'Established 90–100', count: values.filter((value) => value >= 90).length, total, tone: 'safe' },
  ];
}

export function sortedCoverage(blackboard: Blackboard): Array<{ dimension: keyof CoverageVector; value: number }> {
  return (Object.entries(blackboard.coverage) as Array<[keyof CoverageVector, number]>)
    .map(([dimension, value]) => ({ dimension, value }))
    .sort((a, b) => a.value - b.value);
}

export function formatDimension(value: string): string {
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
