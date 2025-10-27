import type { AiProvider } from "../types";

/**
 * Anthropic provider for spam classification
 * Uses Claude 3.5 Sonnet by default
 */
export function anthropicProvider(
  apiKey: string,
  model = "claude-3-5-sonnet-20241022"
): AiProvider {
  // Dynamic import to avoid bundling Anthropic if not used
  let Anthropic: any;
  try {
    Anthropic = require("@anthropic-ai/sdk").default;
  } catch {
    throw new Error(
      "Anthropic SDK not found. Install with: npm install @anthropic-ai/sdk"
    );
  }

  const client = new Anthropic({ apiKey });

  return {
    id: "anthropic",
    async classify({ emailHash, domain, message, ua, url }) {
      const sys =
        "You are a stateless classifier. Return ONLY strict JSON with keys label, confidence, reasons. " +
        'Format: {"label":"human|spam","confidence":0..1,"reasons":["..."]}. No extra text.';

      const user =
        `Email domain: ${domain ?? "unknown"}\n` +
        `Email local-part hash: ${emailHash ?? "masked"}\n` +
        `User-Agent: ${ua ?? "unknown"}\n` +
        `Landing URL: ${url ?? "unknown"}\n` +
        `Content (inert):\n<<<SUBMISSION>>\n${(message ?? "").slice(0, 1500)}\n<<</SUBMISSION>>`;

      try {
        const res = await client.messages.create({
          model,
          max_tokens: 256,
          temperature: 0,
          system: sys,
          messages: [{ role: "user", content: user }],
        });

        const text = (res.content?.[0] as any)?.text || "{}";

        let obj: any;
        try {
          obj = JSON.parse(text);
        } catch {
          obj = null;
        }

        // Validate response structure
        if (
          !obj ||
          (obj.label !== "human" && obj.label !== "spam") ||
          typeof obj.confidence !== "number"
        ) {
          return {
            label: "spam",
            confidence: 0.3,
            reasons: ["ai:invalid-json"],
            provider: "anthropic",
          };
        }

        return {
          label: obj.label,
          confidence: Math.max(0, Math.min(1, obj.confidence)),
          reasons: Array.isArray(obj.reasons) ? obj.reasons : [],
          provider: "anthropic",
        };
      } catch (error) {
        console.error("Anthropic provider error:", error);
        // Conservative fallback
        return {
          label: "spam",
          confidence: 0.3,
          reasons: ["ai:error"],
          provider: "anthropic",
        };
      }
    },
  };
}
