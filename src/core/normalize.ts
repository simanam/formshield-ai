import { Submission } from "../types";

/**
 * Normalizes all fields in a submission for consistent processing
 * - Unicode NFC normalization
 * - Trim whitespace
 * - Collapse multiple spaces
 * - Strip HTML tags
 */
export function normalizeAll(s: Submission): Record<string, string> {
  const out: Record<string, string> = {};

  const add = (k: string, v: any) => {
    if (v === undefined || v === null) return;
    let str = String(v)
      .normalize("NFC")
      .trim()
      .replace(/\s+/g, " ");

    // Strip HTML tags
    str = str.replace(/<[^>]*>/g, "");

    out[k] = str;
  };

  // Add top-level fields first
  add("email", s.email ?? s.fields?.email);
  add("name", s.name ?? s.fields?.name);
  add("message", s.message ?? s.fields?.message);
  add("url", s.url);

  // Add all fields from fields object
  if (s.fields) {
    for (const [k, v] of Object.entries(s.fields)) {
      if (!out[k]) add(k, v);
    }
  }

  return out;
}

/**
 * Strip multiple URLs from text and replace with [URL] token
 */
export function replaceUrls(text: string): string {
  return text.replace(/https?:\/\/\S+/gi, "[URL]");
}

/**
 * Calculate Shannon entropy of a string (for randomness detection)
 */
export function calculateEntropy(str: string): number {
  if (!str || str.length === 0) return 0;

  const freq: Record<string, number> = {};
  for (const char of str.toLowerCase()) {
    freq[char] = (freq[char] || 0) + 1;
  }

  let entropy = 0;
  const len = str.length;

  for (const count of Object.values(freq)) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  return entropy;
}
