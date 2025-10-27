import { Config, Submission, FieldValue } from "../types";
import { hashEmailLocalPart, extractDomain } from "./email";
import { replaceUrls } from "./normalize";

/**
 * Redact PII from submission before sending to AI providers
 * Returns a safe payload with hashed/masked sensitive data
 */
export function redactPayload(
  submission: Submission,
  normalized: Record<string, string>,
  config: Config
): {
  emailHash?: string;
  domain?: string;
  message?: string;
  ua?: string;
  url?: string;
  fields?: Record<string, FieldValue>;
} {
  const piiPolicy = config.piiPolicy || "hash-local";
  const email = normalized["email"] || "";
  const message = normalized["message"] || "";

  let emailHash: string | undefined;
  let domain: string | undefined;

  // Handle email
  if (email) {
    domain = extractDomain(email) || undefined;

    if (piiPolicy === "hash-local") {
      emailHash = hashEmailLocalPart(email);
    } else {
      // "plain" mode - send as-is (for self-hosted AI)
      emailHash = email.split("@")[0];
    }
  }

  // Handle message - truncate and replace URLs
  let redactedMessage: string | undefined;
  if (message) {
    // Truncate to 1500 chars
    let cleaned = message.slice(0, 1500);

    // Replace URLs with [URL] token
    cleaned = replaceUrls(cleaned);

    // Mask phone numbers
    cleaned = cleaned.replace(
      /(\+?\d{1,3}[\s\-\.]?)?(\(?\d{3}\)?[\s\-\.]?)?\d{3}[\s\-\.]?\d{4}/g,
      "[PHONE]"
    );

    // Mask email addresses in message
    cleaned = cleaned.replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      "[EMAIL]"
    );

    redactedMessage = cleaned;
  }

  // Redact fields (optional)
  let redactedFields: Record<string, FieldValue> | undefined;
  if (submission.fields && piiPolicy === "hash-local") {
    redactedFields = {};
    for (const [key, value] of Object.entries(submission.fields)) {
      // Skip PII fields
      if (
        key === "email" ||
        key === "phone" ||
        key === "tel" ||
        key === "name" ||
        key === "firstName" ||
        key === "lastName"
      ) {
        continue;
      }
      redactedFields[key] = value;
    }
  }

  return {
    emailHash,
    domain,
    message: redactedMessage,
    ua: submission.userAgent,
    url: submission.url,
    fields: redactedFields,
  };
}

/**
 * Mask phone numbers for display/logging
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return "****";
  return "***-***-" + phone.slice(-4);
}

/**
 * Mask email for display/logging
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***@***.***";

  const maskedLocal =
    local.length > 2 ? local[0] + "***" + local.slice(-1) : "***";
  return `${maskedLocal}@${domain}`;
}
