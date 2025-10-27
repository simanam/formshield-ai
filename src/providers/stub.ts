import { AiProvider } from "../types";

/**
 * Stub provider for testing without real AI
 * Always returns spam with 50% confidence
 */
export const stubProvider = (id = "stub"): AiProvider => ({
  id,
  async classify() {
    return {
      label: "spam",
      confidence: 0.5,
      reasons: ["stub-provider"],
      provider: id,
    };
  },
});
