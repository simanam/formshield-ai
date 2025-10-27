import { describe, it, expect } from "vitest";
import { createFormShield } from "../src";
import type { AiProvider } from "../src/types";

describe("Router", () => {
  const humanProvider: AiProvider = {
    id: "human-stub",
    async classify() {
      return { label: "human", confidence: 0.9, provider: "human-stub" };
    },
  };

  const spamProvider: AiProvider = {
    id: "spam-stub",
    async classify() {
      return { label: "spam", confidence: 0.8, provider: "spam-stub" };
    },
  };

  it("should use first-available strategy", async () => {
    const shield = createFormShield({
      aiProviders: [humanProvider, spamProvider],
      router: { mode: "first-available", order: ["human-stub", "spam-stub"] },
      grayBand: [0, 100], // Always use AI
    });

    const decision = await shield.evaluate({
      email: "test@example.com",
      message: "Test message",
    });

    expect(decision.reasons).toContain("ai:human");
  });

  it("should handle vote strategy with majority", async () => {
    const spamProvider2: AiProvider = {
      id: "spam-stub-2",
      async classify() {
        return { label: "spam", confidence: 0.8, provider: "spam-stub-2" };
      },
    };

    const shield = createFormShield({
      aiProviders: [humanProvider, spamProvider, spamProvider2],
      router: { mode: "vote", members: ["human-stub", "spam-stub", "spam-stub-2"] },
      grayBand: [0, 100],
    });

    const decision = await shield.evaluate({
      email: "test@example.com",
      name: "Test User",
      message: "Test message for classification",
    });

    // 2 spam vs 1 human - spam should win
    expect(decision.reasons).toContain("ai:spam");
    // Verify AI was actually called
    expect(decision.details?.ai).toBeDefined();
  });

  it("should handle fallback strategy", async () => {
    const errorProvider: AiProvider = {
      id: "error-stub",
      async classify() {
        throw new Error("Provider failed");
      },
    };

    const shield = createFormShield({
      aiProviders: [errorProvider, spamProvider],
      router: { mode: "fallback", primary: "error-stub", secondary: "spam-stub" },
      grayBand: [0, 100],
    });

    const decision = await shield.evaluate({
      email: "test@example.com",
      name: "Test User",
      message: "Test message for fallback testing",
    });

    // Should fall back to spam-stub
    expect(decision.reasons).toContain("ai:spam");
    expect(decision.details?.ai).toBeDefined();
  });

  it("should skip AI when mode is none", async () => {
    const shield = createFormShield({
      aiProviders: [humanProvider],
      router: { mode: "none" },
    });

    const decision = await shield.evaluate({
      email: "test@example.com",
      name: "John Doe",
      message: "Test message about legitimate inquiry",
    });

    // Should not have AI classification reasons (ai:human or ai:spam)
    const hasAiClassification = decision.reasons.some(r =>
      r === "ai:human" || r === "ai:spam"
    );
    expect(hasAiClassification).toBe(false);
  });

  it("should adjust score based on AI confidence", async () => {
    const highConfidenceHuman: AiProvider = {
      id: "confident-human",
      async classify() {
        return { label: "human", confidence: 1.0, provider: "confident-human" };
      },
    };

    const shield = createFormShield({
      aiProviders: [highConfidenceHuman],
      router: { mode: "vote", members: ["confident-human"] },
      grayBand: [0, 100],
    });

    const decision = await shield.evaluate({
      email: "test@example.com",
      message: "Test message",
    });

    // High confidence human should boost score by ~10 points
    expect(decision.score).toBeGreaterThanOrEqual(50);
    expect(decision.reasons).toContain("ai:human");
  });
});
