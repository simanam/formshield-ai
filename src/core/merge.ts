import { Decision, ProviderResult } from "../types";

/**
 * Merge AI provider results with base rules-based decision
 * Implements voting and blending strategies
 */
export function mergeAi(
  base: Decision,
  results: ProviderResult[]
): Decision {
  if (!results.length) return base;

  // Count votes for each label
  const counts = results.reduce(
    (m, r) => {
      m[r.label] = (m[r.label] || 0) + 1;
      return m;
    },
    {} as Record<string, number>
  );

  // Determine majority label
  const humanVotes = counts["human"] || 0;
  const spamVotes = counts["spam"] || 0;

  let majority: "human" | "spam";

  if (humanVotes > spamVotes) {
    majority = "human";
  } else if (spamVotes > humanVotes) {
    majority = "spam";
  } else {
    // Tie - use mean confidence to break
    const humanResults = results.filter((r) => r.label === "human");
    const spamResults = results.filter((r) => r.label === "spam");

    const humanMeanConf =
      humanResults.reduce((s, r) => s + r.confidence, 0) / humanResults.length ||
      0;
    const spamMeanConf =
      spamResults.reduce((s, r) => s + r.confidence, 0) / spamResults.length ||
      0;

    // If still tied, prefer spam (conservative bias)
    majority = humanMeanConf > spamMeanConf ? "human" : "spam";
  }

  // Calculate mean confidence for the majority label
  const majorityResults = results.filter((r) => r.label === majority);
  const meanConf =
    majorityResults.reduce((s, r) => s + r.confidence, 0) /
      majorityResults.length || 0.5;

  // Calculate delta: ±10 points scaled by confidence
  // human = +delta, spam = -delta
  const delta = (majority === "human" ? +10 : -10) * meanConf;

  // Apply delta to base score
  const score = Math.max(0, Math.min(100, Math.round(base.score + delta)));

  // Collect all reasons
  const reasons = [
    ...base.reasons,
    `ai:${majority}`,
    ...results.flatMap((r) =>
      (r.reasons || []).map((x) => `ai:${r.provider || "p"}:${x}`)
    ),
  ];

  // Determine final action
  const action: Decision["action"] =
    score >= 70 ? "allow" : score <= 35 ? "block" : "review";

  return {
    action,
    score,
    reasons,
    details: {
      ...base.details,
      ai: {
        results,
        majority,
        meanConf,
        delta,
        votes: { human: humanVotes, spam: spamVotes },
      },
    },
  };
}

/**
 * Alternative: Blend strategy for weighted averaging
 * This is used when router mode is "blend"
 */
export function blendResults(
  base: Decision,
  results: (ProviderResult & { weight?: number })[]
): Decision {
  if (!results.length) return base;

  // Calculate weighted score adjustment
  const totalWeight = results.reduce((sum, r) => sum + (r.weight || 1), 0);

  const weightedSum = results.reduce((sum, r) => {
    const weight = r.weight || 1;
    const sign = r.label === "human" ? +1 : -1;
    return sum + sign * r.confidence * weight;
  }, 0);

  // Map to ±10 delta
  const normalizedScore = weightedSum / totalWeight; // -1..1
  const delta = normalizedScore * 10; // -10..10

  const score = Math.max(0, Math.min(100, Math.round(base.score + delta)));

  const reasons = [
    ...base.reasons,
    "ai:blend",
    ...results.flatMap((r) =>
      (r.reasons || []).map((x) => `ai:${r.provider || "p"}:${x}`)
    ),
  ];

  const action: Decision["action"] =
    score >= 70 ? "allow" : score <= 35 ? "block" : "review";

  return {
    action,
    score,
    reasons,
    details: {
      ...base.details,
      ai: {
        results,
        strategy: "blend",
        delta,
        weightedSum,
        totalWeight,
      },
    },
  };
}
