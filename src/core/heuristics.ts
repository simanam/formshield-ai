import { Config, Submission } from "../types";
import {
  isValidEmail,
  extractDomain,
  checkEmailLocalPartQuality,
  isWorkplaceEmail,
} from "./email";
import disposableDomains from "../data/disposable-domains.json";

/**
 * Run all heuristics checks and return initial score + reasons
 * Base score starts at 50 (neutral)
 */
export function runHeuristics(
  submission: Submission,
  normalized: Record<string, string>,
  config: Config
): { score: number; reasons: string[] } {
  let score = 50; // Start neutral
  const reasons: string[] = [];

  // Extract key fields
  const email = normalized["email"] || "";
  const message = normalized["message"] || "";
  const name = normalized["name"] || "";

  // ===== EMAIL CHECKS =====
  if (email) {
    // Basic validation
    if (!isValidEmail(email)) {
      score -= 20;
      reasons.push("email:invalid-format");
    } else {
      const domain = extractDomain(email);
      const [localPart] = email.split("@");

      if (domain) {
        // Check disposable domains
        if (
          disposableDomains.includes(domain) ||
          config.disposableDomains?.includes(domain)
        ) {
          score -= 25;
          reasons.push("email:disposable-domain");
        }

        // Check blocked domains
        if (config.blockDomains?.includes(domain)) {
          score -= 50;
          reasons.push("email:blocked-domain");
        }

        // Check TLD risk
        const tld = domain.split(".").pop();
        if (tld && config.tldRisk?.[tld]) {
          const penalty = config.tldRisk[tld];
          score -= penalty;
          reasons.push(`email:risky-tld-${tld}`);
        }

        // Check local-part quality (gibberish detection)
        const qualityCheck = checkEmailLocalPartQuality(localPart, domain);
        score += qualityCheck.score;
        reasons.push(...qualityCheck.reasons);
      }
    }
  } else {
    // No email provided
    score -= 15;
    reasons.push("email:missing");
  }

  // ===== MESSAGE CHECKS =====
  if (message) {
    // Check for URL-only message
    if (/^https?:\/\/\S+$/i.test(message.trim())) {
      score -= 30;
      reasons.push("msg:url-only");
    }

    // Count URLs in message
    const urlMatches = message.match(/https?:\/\/\S+/gi) || [];
    if (urlMatches.length > 3) {
      score -= 15;
      reasons.push("msg:excessive-urls");
    } else if (urlMatches.length > 1) {
      score -= 8;
      reasons.push("msg:multiple-urls");
    }

    // Check link density (URL chars / total chars)
    const totalUrlChars = urlMatches.reduce((sum, url) => sum + url.length, 0);
    const linkDensity = totalUrlChars / message.length;
    if (linkDensity > 0.5) {
      score -= 12;
      reasons.push("msg:high-link-density");
    }

    // Check message length
    if (message.length < 10) {
      score -= 10;
      reasons.push("msg:too-short");
    } else if (message.length > 5000) {
      score -= 5;
      reasons.push("msg:suspiciously-long");
    }

    // Check for blocked keywords
    if (config.blockKeywords) {
      const lowerMsg = message.toLowerCase();
      for (const keyword of config.blockKeywords) {
        if (lowerMsg.includes(keyword.toLowerCase())) {
          score -= 15;
          reasons.push(`msg:blocked-keyword-${keyword}`);
        }
      }
    }

    // Check for prompt injection patterns
    const injectionPatterns = [
      /ignore\s+previous/i,
      /system\s*:/i,
      /assistant\s*:/i,
      /<script>/i,
      /<\/system>/i,
      /you\s+are\s+now/i,
      /\[INST\]/i,
      /<<SYS>>/i,
    ];

    for (const pattern of injectionPatterns) {
      if (pattern.test(message)) {
        score -= 20;
        reasons.push("ai:injection-attempt");
        break;
      }
    }

    // Check for base64 encoded content (potential payload)
    const base64Pattern =
      /^(?:[A-Za-z0-9+\/]{4})*(?:[A-Za-z0-9+\/]{2}==|[A-Za-z0-9+\/]{3}=)?$/;
    const words = message.split(/\s+/);
    for (const word of words) {
      if (word.length > 50 && base64Pattern.test(word)) {
        score -= 15;
        reasons.push("msg:base64-payload");
        break;
      }
    }

    // Repeated words/tokens (keyword stuffing)
    const wordFreq: Record<string, number> = {};
    const tokens = message.toLowerCase().split(/\s+/);
    for (const token of tokens) {
      if (token.length > 3) {
        wordFreq[token] = (wordFreq[token] || 0) + 1;
      }
    }

    const maxFreq = Math.max(...Object.values(wordFreq));
    if (maxFreq > 5) {
      score -= 10;
      reasons.push("msg:keyword-stuffing");
    }
  } else {
    // No message
    score -= 10;
    reasons.push("msg:missing");
  }

  // ===== NAME CHECKS =====
  if (name) {
    // Check for excessive emojis
    const emojiCount = (name.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    if (emojiCount > 2) {
      score -= 10;
      reasons.push("name:excessive-emoji");
    }

    // Check ASCII ratio
    const asciiCount = (name.match(/[\x00-\x7F]/g) || []).length;
    const asciiRatio = asciiCount / name.length;
    if (asciiRatio < 0.5 && name.length > 5) {
      score -= 5;
      reasons.push("name:low-ascii-ratio");
    }

    // Check for repeated characters
    if (/(.)\1{3,}/.test(name)) {
      score -= 8;
      reasons.push("name:repeated-chars");
    }
  } else {
    score -= 5;
    reasons.push("name:missing");
  }

  // ===== TIMING CHECKS =====
  if (submission.timestampMs && submission.renderedAtMs) {
    const fillTime = submission.timestampMs - submission.renderedAtMs;
    // Too fast (bot)
    if (fillTime < 2000) {
      score -= 15;
      reasons.push("timing:too-fast");
    }
    // Too slow (suspicious)
    if (fillTime > 3600000) {
      // 1 hour
      score -= 5;
      reasons.push("timing:suspiciously-slow");
    }
  }

  // ===== USER AGENT CHECKS =====
  if (submission.userAgent) {
    const ua = submission.userAgent.toLowerCase();
    // Check for common bot patterns
    if (
      ua.includes("bot") ||
      ua.includes("crawler") ||
      ua.includes("spider") ||
      ua.includes("scraper")
    ) {
      score -= 25;
      reasons.push("ua:bot-detected");
    }

    // Check for missing UA (suspicious)
    if (ua.trim().length === 0) {
      score -= 10;
      reasons.push("ua:missing");
    }
  }

  return { score: Math.max(0, Math.min(100, score)), reasons };
}
