import { AiProvider, Config, ProviderResult } from "../types";

/**
 * Route AI classification requests based on strategy
 * Implements: first-available, fallback, vote, blend, canary, ab
 */
export async function routeAndClassify(
  cfg: Config,
  payload: any
): Promise<ProviderResult[]> {
  const providers = indexProviders(cfg.aiProviders || []);
  const router = cfg.router!;

  try {
    switch (router.mode) {
      case "first-available":
        return await handleFirstAvailable(providers, router.order, payload);

      case "fallback":
        return await handleFallback(
          providers,
          router.primary,
          router.secondary,
          payload
        );

      case "vote":
        return await handleVote(providers, router.members, payload);

      case "blend":
        return await handleBlend(providers, router.members, payload);

      case "canary":
        return await handleCanary(
          providers,
          router.control,
          router.candidate,
          router.pct,
          payload
        );

      case "ab":
        return await handleAB(
          providers,
          router.a,
          router.b,
          router.salt,
          payload
        );

      default:
        return [];
    }
  } catch (error) {
    console.error("Router error:", error);
    return [];
  }
}

// ===== STRATEGY HANDLERS =====

/**
 * first-available: Use first provider in order
 */
async function handleFirstAvailable(
  providers: Record<string, AiProvider>,
  order: string[],
  payload: any
): Promise<ProviderResult[]> {
  const providerId = order[0];
  if (!providers[providerId]) {
    throw new Error(`Provider ${providerId} not found`);
  }
  const result = await providers[providerId].classify(payload);
  return [result];
}

/**
 * fallback: Try primary, fall back to secondary on error/timeout
 */
async function handleFallback(
  providers: Record<string, AiProvider>,
  primaryId: string,
  secondaryId: string,
  payload: any
): Promise<ProviderResult[]> {
  const primary = providers[primaryId];
  const secondary = providers[secondaryId];

  if (!primary || !secondary) {
    throw new Error("Primary or secondary provider not found");
  }

  try {
    // Try primary with timeout
    const result = await withTimeout(
      primary.classify(payload),
      800 // 800ms timeout
    );
    return [result];
  } catch (error) {
    // Fallback to secondary
    console.warn(`Primary provider ${primaryId} failed, using fallback`);
    try {
      const result = await secondary.classify(payload);
      return [{ ...result, provider: `${secondaryId}(fallback)` }];
    } catch (fallbackError) {
      console.error("Fallback provider also failed:", fallbackError);
      return [];
    }
  }
}

/**
 * vote: Call multiple providers and return majority vote
 */
async function handleVote(
  providers: Record<string, AiProvider>,
  members: string[],
  payload: any
): Promise<ProviderResult[]> {
  const promises = members.map((id) => {
    const provider = providers[id];
    if (!provider) {
      console.warn(`Provider ${id} not found, skipping`);
      return null;
    }
    return provider.classify(payload).catch((err) => {
      console.warn(`Provider ${id} failed:`, err);
      return null;
    });
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is ProviderResult => r !== null);
}

/**
 * blend: Weighted average of confidences
 */
async function handleBlend(
  providers: Record<string, AiProvider>,
  members: { id: string; weight?: number }[],
  payload: any
): Promise<ProviderResult[]> {
  const promises = members.map(async (m) => {
    const provider = providers[m.id];
    if (!provider) {
      console.warn(`Provider ${m.id} not found, skipping`);
      return null;
    }
    try {
      const result = await provider.classify(payload);
      return { ...result, weight: m.weight || 1 };
    } catch (err) {
      console.warn(`Provider ${m.id} failed:`, err);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter((r): r is ProviderResult => r !== null);
}

/**
 * canary: Send small % of traffic to candidate model
 */
async function handleCanary(
  providers: Record<string, AiProvider>,
  controlId: string,
  candidateId: string,
  pct: number,
  payload: any
): Promise<ProviderResult[]> {
  const rnd = Math.random();
  const useCandidate = rnd < pct / 100;

  const providerId = useCandidate ? candidateId : controlId;
  const provider = providers[providerId];

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`);
  }

  const result = await provider.classify(payload);
  return [{ ...result, provider: `${providerId}${useCandidate ? "(canary)" : ""}` }];
}

/**
 * ab: Route by hash for A/B testing
 */
async function handleAB(
  providers: Record<string, AiProvider>,
  aId: string,
  bId: string,
  salt: string | undefined,
  payload: any
): Promise<ProviderResult[]> {
  const hash = simpleHash(JSON.stringify(payload) + (salt || ""));
  const useB = hash % 2 === 1;

  const providerId = useB ? bId : aId;
  const provider = providers[providerId];

  if (!provider) {
    throw new Error(`Provider ${providerId} not found`);
  }

  const result = await provider.classify(payload);
  return [{ ...result, provider: `${providerId}(${useB ? "b" : "a"})` }];
}

// ===== HELPERS =====

/**
 * Index providers by ID for fast lookup
 */
function indexProviders(list: AiProvider[]): Record<string, AiProvider> {
  const map: Record<string, AiProvider> = {};
  for (const p of list) {
    map[p.id] = p;
  }
  return map;
}

/**
 * Simple hash function for A/B routing
 */
function simpleHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * Execute promise with timeout
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("Timeout")), ms)
    ),
  ]);
}
