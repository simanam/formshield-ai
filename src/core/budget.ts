/**
 * Budget tracking for AI costs
 * Simple in-memory implementation
 * TODO: Implement persistent storage for production use
 */

interface BudgetTracker {
  perRequestSpend: number;
  rollingSpend: number;
  rollingWindowStart: number;
  requestCount: number;
}

const tracker: BudgetTracker = {
  perRequestSpend: 0,
  rollingSpend: 0,
  rollingWindowStart: Date.now(),
  requestCount: 0,
};

// Rolling window duration (24 hours)
const WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Check if budget allows another AI request
 */
export function canAffordAiCall(
  perRequestUsd?: number,
  rollingUsd?: number
): boolean {
  resetWindowIfNeeded();

  // Check per-request limit
  if (perRequestUsd !== undefined && tracker.perRequestSpend >= perRequestUsd) {
    return false;
  }

  // Check rolling limit
  if (rollingUsd !== undefined && tracker.rollingSpend >= rollingUsd) {
    return false;
  }

  return true;
}

/**
 * Record AI spend for a request
 * TODO: Implement actual cost calculation based on tokens
 */
export function recordSpend(estimatedUsd: number = 0.001): void {
  resetWindowIfNeeded();

  tracker.perRequestSpend += estimatedUsd;
  tracker.rollingSpend += estimatedUsd;
  tracker.requestCount++;
}

/**
 * Reset per-request spend counter
 */
export function resetRequestSpend(): void {
  tracker.perRequestSpend = 0;
}

/**
 * Get current budget stats
 */
export function getBudgetStats(): {
  perRequestSpend: number;
  rollingSpend: number;
  requestCount: number;
  windowStart: Date;
} {
  resetWindowIfNeeded();
  return {
    perRequestSpend: tracker.perRequestSpend,
    rollingSpend: tracker.rollingSpend,
    requestCount: tracker.requestCount,
    windowStart: new Date(tracker.rollingWindowStart),
  };
}

/**
 * Reset rolling window if expired
 */
function resetWindowIfNeeded(): void {
  const now = Date.now();
  if (now - tracker.rollingWindowStart > WINDOW_MS) {
    tracker.rollingSpend = 0;
    tracker.requestCount = 0;
    tracker.rollingWindowStart = now;
  }
}

/**
 * Manually reset all budgets (for testing)
 */
export function resetBudgets(): void {
  tracker.perRequestSpend = 0;
  tracker.rollingSpend = 0;
  tracker.requestCount = 0;
  tracker.rollingWindowStart = Date.now();
}
