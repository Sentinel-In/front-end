import { describe, expect, it } from 'vitest';
import blackboardData from '../data/blackboard.json';
import type { Blackboard } from '../types';
import {
  assetsNotEstablished,
  coverageDistribution,
  executiveAlerts,
  sortedCoverage,
} from './executiveDashboard';
import { compositeCoverage, weakestDimension } from './coverage';

const blackboard = blackboardData as Blackboard;

describe('executive dashboard selectors', () => {
  it('derives alerts from blackboard findings without inventing a risk score', () => {
    const alerts = executiveAlerts(blackboard);

    expect(alerts).toHaveLength(4);
    expect(alerts.filter((alert) => alert.severity === 'Critical')).toHaveLength(1);
    expect(alerts.filter((alert) => alert.severity === 'High')).toHaveLength(3);
  });

  it('treats null and under-investigation asset evidence as not established', () => {
    expect(assetsNotEstablished(blackboard)).toBe(2);
  });

  it('distributes every real coverage dimension into evidence bands', () => {
    expect(coverageDistribution(blackboard).map((band) => band.count)).toEqual([1, 0, 9]);
    expect(sortedCoverage(blackboard)[0]).toEqual({ dimension: 'applicability', value: 40 });
  });

  it('keeps the authoritative composite and weakest dimension paired', () => {
    expect(compositeCoverage(blackboard)).toBe(92);
    expect(weakestDimension(blackboard)).toEqual({ dimension: 'applicability', value: 40 });
  });
});
