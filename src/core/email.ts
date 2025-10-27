import { calculateEntropy } from "./normalize";
import crypto from "crypto";

/**
 * Basic RFC 5322 email validation
 */
export function isValidEmail(email: string): boolean {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

/**
 * Hash email local-part for privacy
 */
export function hashEmailLocalPart(email: string): string {
  const [localPart] = email.split("@");
  return crypto.createHash("sha256").update(localPart).digest("hex");
}

/**
 * Extract domain from email
 */
export function extractDomain(email: string): string | null {
  const parts = email.split("@");
  if (parts.length !== 2) return null;
  return parts[1].toLowerCase();
}

/**
 * Check if email local-part looks like gibberish/random
 */
export function checkEmailLocalPartQuality(
  localPart: string,
  domain: string
): {
  score: number;
  reasons: string[];
} {
  const results = { score: 0, reasons: [] as string[] };

  // 1. Calculate Shannon entropy (high = random)
  const entropy = calculateEntropy(localPart);
  if (entropy > 4.5) {
    results.score -= 15;
    results.reasons.push("email:high-entropy");
  }

  // 2. Check for numeric suffix spam pattern (e.g., john12345)
  if (/^[a-z]+[0-9]{4,}$/i.test(localPart)) {
    results.score -= 12;
    results.reasons.push("email:numeric-suffix-spam");
  }

  // 3. Check vowel ratio (all consonants or all vowels)
  const vowelRatio =
    (localPart.match(/[aeiou]/gi)?.length || 0) / localPart.length;
  if (vowelRatio < 0.1 || vowelRatio > 0.8) {
    results.score -= 10;
    results.reasons.push("email:abnormal-vowel-ratio");
  }

  // 4. Known consumer domains should have human-like locals
  const consumerDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "protonmail.com",
  ];

  if (consumerDomains.includes(domain.toLowerCase())) {
    // Expect patterns like: firstname.lastname, firstname+tag, etc.
    const hasHumanPattern =
      /^[a-z]{2,}[._+-][a-z]{2,}/i.test(localPart) ||
      /^[a-z]{3,}[._+-]?[a-z]{0,3}$/i.test(localPart);

    if (!hasHumanPattern) {
      results.score -= 18;
      results.reasons.push("email:random-on-consumer-domain");
    }
  }

  // 5. Repeated character patterns (e.g., aaabbbccc)
  if (/(.)\1{2,}/.test(localPart)) {
    results.score -= 8;
    results.reasons.push("email:repeated-chars");
  }

  // 6. Check for keyboard mashing (sequential keys)
  const keyboardPatterns = [
    "qwerty",
    "asdfgh",
    "zxcvbn",
    "123456",
    "qazwsx",
    "poiuyt",
  ];
  const lowerLocal = localPart.toLowerCase();
  for (const pattern of keyboardPatterns) {
    if (lowerLocal.includes(pattern)) {
      results.score -= 10;
      results.reasons.push("email:keyboard-mash");
      break;
    }
  }

  return results;
}

/**
 * Check if domain is a known workplace/corporate email
 * vs generic consumer email
 */
export function isWorkplaceEmail(domain: string): boolean {
  const consumerDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "aol.com",
    "icloud.com",
    "mail.com",
    "protonmail.com",
    "gmx.com",
    "yandex.com",
    "zoho.com",
  ];

  return !consumerDomains.includes(domain.toLowerCase());
}

/**
 * Check if email domain matches website domain
 */
export function domainsMatch(
  emailDomain: string,
  websiteDomain: string
): boolean {
  const cleanEmail = emailDomain.toLowerCase().replace(/^www\./, "");
  const cleanWebsite = websiteDomain.toLowerCase().replace(/^www\./, "");

  return cleanEmail === cleanWebsite || cleanEmail.endsWith(`.${cleanWebsite}`);
}
