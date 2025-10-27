import { Config, Submission, Decision } from "../types";
import { withDefaults } from "./config";
import { normalizeAll } from "./normalize";
import { runHeuristics } from "./heuristics";
import { applyRules } from "./rules";
import { redactPayload } from "./redact";
import { routeAndClassify } from "./router";
import { mergeAi } from "./merge";
import { getCached, setCached } from "./cache";
import {
  canAffordAiCall,
  recordSpend,
  resetRequestSpend,
} from "./budget";

/**
 * Create a FormShield instance with the given configuration
 */
export function createFormShield(userCfg: Partial<Config> = {}) {
  const config = withDefaults(userCfg);

  return {
    /**
     * Evaluate a form submission and return a decision
     * Pipeline: normalize → heuristics → rules → [AI if gray zone] → finalize
     */
    async evaluate(sub: Submission): Promise<Decision> {
      // Reset per-request budget
      resetRequestSpend();

      // Check cache first
      if (config.cacheTtlMs) {
        const cached = getCached(sub, config.cacheTtlMs);
        if (cached) {
          return { ...cached, reasons: [...cached.reasons, "cache:hit"] };
        }
      }

      // Step 1: Normalize all fields
      const normalized = normalizeAll(sub);

      // Step 2: Run heuristics (rules-based scoring)
      let { score, reasons } = runHeuristics(sub, normalized, config);

      // Step 3: Apply custom rules
      const ruled = applyRules(sub, normalized, score, reasons, config);

      // If rules short-circuited with explicit action, return immediately
      if (ruled.action === "allow" || ruled.action === "block") {
        const final = ruled;
        if (config.cacheTtlMs) {
          setCached(sub, final);
        }
        return final;
      }

      // Step 4: Check if score is in gray band for AI classification
      const [lo, hi] = config.grayBand ?? [45, 65];
      const inGrayBand = ruled.score >= lo && ruled.score <= hi;

      // Skip AI if:
      // - No router configured
      // - Router mode is 'none'
      // - Score is not in gray band
      // - Budget exceeded
      if (
        !config.router ||
        config.router.mode === "none" ||
        !inGrayBand
      ) {
        const final = finalize(ruled.score, ruled.reasons);
        if (config.cacheTtlMs) {
          setCached(sub, final);
        }
        return final;
      }

      // Check AI budget
      if (!canAffordAiCall(
        config.aiBudget?.perRequestUsd,
        config.aiBudget?.rollingUsd
      )) {
        const final = finalize(ruled.score, [
          ...ruled.reasons,
          "ai:budget-exceeded",
        ]);
        if (config.cacheTtlMs) {
          setCached(sub, final);
        }
        return final;
      }

      // Step 5: Redact PII and prepare payload for AI
      const redacted = redactPayload(sub, normalized, config);

      // Step 6: Route to AI providers
      let results: Awaited<ReturnType<typeof routeAndClassify>>;
      try {
        results = await routeAndClassify(config, redacted);
        // Record spend (TODO: Calculate actual cost based on tokens)
        recordSpend(0.001); // Placeholder: $0.001 per request
      } catch (error) {
        console.error("AI classification failed:", error);
        results = [];
      }

      // Step 7: Merge AI results with rules-based decision
      const merged = mergeAi(finalize(ruled.score, ruled.reasons), results);

      // Cache final decision
      if (config.cacheTtlMs) {
        setCached(sub, merged);
      }

      return merged;
    },
  };
}

/**
 * Finalize decision based on score
 */
function finalize(score: number, reasons: string[]): Decision {
  const clamped = Math.max(0, Math.min(100, score));
  const action: Decision["action"] =
    clamped >= 70 ? "allow" : clamped <= 35 ? "block" : "review";

  return {
    action,
    score: clamped,
    reasons,
  };
}
