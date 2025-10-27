/**
 * Simple in-memory cache for decision results
 * TODO: Implement persistent cache (Redis, etc.) for production
 */

import crypto from "crypto";

interface CacheEntry {
  decision: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Generate cache key from submission
 */
function getCacheKey(submission: any): string {
  const normalized = {
    email: submission.email,
    message: submission.message,
    name: submission.name,
  };
  const str = JSON.stringify(normalized);
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Get cached decision if available and not expired
 */
export function getCached(
  submission: any,
  ttlMs: number
): any | null {
  const key = getCacheKey(submission);
  const entry = cache.get(key);

  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > ttlMs) {
    cache.delete(key);
    return null;
  }

  return entry.decision;
}

/**
 * Store decision in cache
 */
export function setCached(submission: any, decision: any): void {
  const key = getCacheKey(submission);
  cache.set(key, {
    decision,
    timestamp: Date.now(),
  });
}

/**
 * Clear all cached entries
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Get cache stats
 */
export function getCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}
