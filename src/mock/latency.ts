/* ============================================================
   Mock Latency — SPEC §5
   Artificial latency 120–400ms for mock API calls.
   ============================================================ */

export function randomLatency(min = 120, max = 400): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function delay(ms?: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms ?? randomLatency()));
}
