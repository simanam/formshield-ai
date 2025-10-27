import { describe, it, expect } from "vitest";
import { createFormShield, rulePhoneLooksFake, ruleUrlOnlyMessage, ruleCompanyVsDomainMismatch } from "../src";

describe("Rules", () => {
  it("should allow whitelisted domains", async () => {
    const shield = createFormShield({
      allowDomains: ["trusted.com"],
      router: { mode: "none" },
    });

    const decision = await shield.evaluate({
      email: "user@trusted.com",
      message: "This should be allowed",
    });

    expect(decision.action).toBe("allow");
    expect(decision.reasons).toContain("rules:allow-domain");
  });

  it("should block blacklisted domains", async () => {
    const shield = createFormShield({
      blockDomains: ["spam.com"],
      router: { mode: "none" },
    });

    const decision = await shield.evaluate({
      email: "spammer@spam.com",
      message: "This should be blocked",
    });

    expect(decision.action).toBe("block");
    expect(decision.reasons).toContain("rules:block-domain");
  });

  it("should detect fake phone numbers - repeated digits", async () => {
    const ctx = {
      normalized: { phone: "111-111-1111" },
      fields: { phone: "111-111-1111" },
    };
    const result = rulePhoneLooksFake(ctx as any);
    expect(result?.reasons).toContain("phone:repeated-digits");
  });

  it("should flag URL-only messages", async () => {
    const ctx = {
      normalized: { message: "https://spam-site.com" },
      fields: { message: "https://spam-site.com" },
    };
    const result = ruleUrlOnlyMessage(ctx as any);
    expect(result?.action).toBe("block");
  });

  it("should detect email/website domain mismatch", async () => {
    const ctx = {
      normalized: {
        email: "user@company-a.com",
        website: "https://company-b.com",
      },
      fields: {
        email: "user@company-a.com",
        website: "https://company-b.com",
      },
    };
    const result = ruleCompanyVsDomainMismatch(ctx as any);
    expect(result?.reasons).toContain("cross:email-website-mismatch");
  });

  it("should work with custom rules", async () => {
    const shield = createFormShield({
      customRules: [
        (ctx) => {
          if (ctx.normalized.message?.includes("forbidden-word")) {
            return { action: "block", score: 0, reasons: ["custom:forbidden-word"] };
          }
          return null;
        },
      ],
      router: { mode: "none" },
    });

    const decision = await shield.evaluate({
      email: "test@example.com",
      message: "This contains forbidden-word",
    });

    expect(decision.action).toBe("block");
    expect(decision.reasons).toContain("custom:forbidden-word");
  });
});
