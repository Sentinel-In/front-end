import blackboardData from '../data/blackboard.json';
import type { Blackboard, Case } from '../types';

// Simulate latency for the mock API
const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const blackboardApi = {
  async getBlackboard(): Promise<Blackboard> {
    // 200–500ms latency as specified
    const ms = Math.floor(Math.random() * 300) + 200;
    await delay(ms);
    return blackboardData as unknown as Blackboard;
  },

  async listCases(): Promise<Partial<Case>[]> {
    await delay(200);
    // Derived from the one case for now
    return [
      blackboardData.case as unknown as Case
    ];
  }
};
