import type { Config, Submission, Rule, Decision } from "../types";
import { extractDomain } from "./email";
import { hashEmailLocalPart } from "./email";

/**
 * Apply custom rules and return final decision with updated score/reasons
 * Rules can short-circuit with explicit allow/block actions
 */
export function applyRules(
  sub: Submission,
  normalized: Record<string, string>,
  score: number,
  reasons: string[],
  cfg: Config
): Decision {
  const email = normalized["email"] || "";
  const domain = email ? extractDomain(email) : null;

  // Check allow/block lists first (highest priority)
  if (domain && cfg.allowDomains?.includes(domain)) {
    return {
      action: "allow",
      score: 90,
      reasons: [...reasons, "rules:allow-domain"],
    };
  }

  if (domain && cfg.blockDomains?.includes(domain)) {
    return {
      action: "block",
      score: 5,
      reasons: [...reasons, "rules:block-domain"],
    };
  }

  // Check hashed email allow/block lists
  if (email && cfg.allowEmailsHashed) {
    const hash = hashEmailLocalPart(email);
    if (cfg.allowEmailsHashed.includes(hash)) {
      return {
        action: "allow",
        score: 95,
        reasons: [...reasons, "rules:allow-email-hash"],
      };
    }
  }

  if (email && cfg.blockEmailsHashed) {
    const hash = hashEmailLocalPart(email);
    if (cfg.blockEmailsHashed.includes(hash)) {
      return {
        action: "block",
        score: 0,
        reasons: [...reasons, "rules:block-email-hash"],
      };
    }
  }

  // Apply custom rules
  let cur = { action: "review" as const, score, reasons: [...reasons] };

  for (const rule of cfg.customRules || []) {
    const out = rule({ ...sub, normalized });
    if (!out) continue;

    // Merge reasons
    if (out.reasons) {
      cur.reasons.push(...out.reasons);
    }

    // Update score
    if (typeof out.score === "number") {
      cur.score = Math.max(0, Math.min(100, out.score));
    }

    // Short-circuit on explicit action
    if (out.action === "allow" || out.action === "block") {
      return {
        action: out.action,
        score: cur.score,
        reasons: cur.reasons,
      };
    }
  }

  return cur;
}

// ===== BUILT-IN RULES (Exported for reuse) =====

/**
 * Rule: Detect fake/invalid phone numbers
 */
export const rulePhoneLooksFake: Rule = ({ normalized }) => {
  const phone =
    normalized["phone"] || normalized["tel"] || normalized["telephone"] || "";
  if (!phone) return null;

  // Basic phone format check (at least 7 digits)
  if (!/^(?:\+?\d[\s\-\.\(\)]?){7,}$/.test(phone)) {
    return { score: 35, reasons: ["phone:invalid-format"] };
  }

  // Detect repeated digits (e.g., 111-111-1111)
  if (/^(?:\+?1?[\s\-\.\(\)]?)?(\d)\1{2}[\s\-\.\(\)]?(\d)\2{2}[\s\-\.\(\)]?(\d)\3{3}$/.test(phone)) {
    return { score: 25, reasons: ["phone:repeated-digits"] };
  }

  // Detect sequential numbers (123456789)
  const digits = phone.replace(/\D/g, "");
  let sequential = 0;
  for (let i = 1; i < digits.length; i++) {
    if (parseInt(digits[i]) === parseInt(digits[i - 1]) + 1) {
      sequential++;
    }
  }
  if (sequential >= 6) {
    return { score: 30, reasons: ["phone:sequential-digits"] };
  }

  return null;
};

/**
 * Rule: Block messages that are only a URL
 */
export const ruleUrlOnlyMessage: Rule = ({ normalized }) => {
  const msg = normalized["message"] || "";
  if (msg && /^https?:\/\/\S+$/i.test(msg.trim())) {
    return { action: "block", score: 5, reasons: ["msg:url-only"] };
  }
  return null;
};

/**
 * Rule: Flag mismatch between email domain and website domain
 * (e.g., email from gmail.com but claiming to be from company.com)
 */
export const ruleCompanyVsDomainMismatch: Rule = ({ normalized }) => {
  const email = normalized["email"] || "";
  const domain = email ? extractDomain(email) : null;
  const website =
    normalized["website"] || normalized["url"] || normalized["company_url"] || "";

  if (!domain || !website) return null;

  // Extract domain from website URL
  const websiteDomain = website
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .split("/")[0]
    .toLowerCase();

  const emailDomain = domain.toLowerCase();

  // Check if domains match
  if (
    websiteDomain &&
    emailDomain &&
    !websiteDomain.endsWith(emailDomain) &&
    !emailDomain.endsWith(websiteDomain)
  ) {
    // Consumer domains are expected to not match
    const consumerDomains = [
      "gmail.com",
      "yahoo.com",
      "hotmail.com",
      "outlook.com",
    ];
    if (!consumerDomains.includes(emailDomain)) {
      return { score: 40, reasons: ["cross:email-website-mismatch"] };
    }
  }

  return null;
};

/**
 * Rule: Detect excessive use of capital letters (SHOUTING)
 */
export const ruleExcessiveCaps: Rule = ({ normalized }) => {
  const msg = normalized["message"] || "";
  if (!msg || msg.length < 20) return null;

  const upperCount = (msg.match(/[A-Z]/g) || []).length;
  const letterCount = (msg.match(/[A-Za-z]/g) || []).length;

  if (letterCount > 0) {
    const capsRatio = upperCount / letterCount;
    if (capsRatio > 0.6) {
      return { score: 35, reasons: ["msg:excessive-caps"] };
    }
  }

  return null;
};

/**
 * Rule: Detect cryptocurrency/trading spam keywords
 */
export const ruleCryptoSpam: Rule = ({ normalized }) => {
  const msg = (normalized["message"] || "").toLowerCase();
  if (!msg) return null;

  const cryptoKeywords = [
    "bitcoin",
    "crypto",
    "forex",
    "trading",
    "investment opportunity",
    "get rich",
    "guaranteed profit",
    "blockchain",
    "nft",
    "web3",
    "airdrop",
  ];

  let matches = 0;
  for (const keyword of cryptoKeywords) {
    if (msg.includes(keyword)) {
      matches++;
    }
  }

  if (matches >= 2) {
    return { score: 25, reasons: ["msg:crypto-spam"] };
  }

  return null;
};

/**
 * Rule: Detect SEO/backlink spam
 */
export const ruleSeoSpam: Rule = ({ normalized }) => {
  const msg = (normalized["message"] || "").toLowerCase();
  if (!msg) return null;

  const seoKeywords = [
    "backlink",
    "seo service",
    "rank higher",
    "google ranking",
    "increase traffic",
    "domain authority",
    "page authority",
    "link building",
    "guest post",
    "sponsored post",
  ];

  let matches = 0;
  for (const keyword of seoKeywords) {
    if (msg.includes(keyword)) {
      matches++;
    }
  }

  if (matches >= 1) {
    return { score: 20, reasons: ["msg:seo-spam"] };
  }

  return null;
};

export type { Rule } from "../types";
