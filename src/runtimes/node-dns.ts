import { promises as dns } from "dns";

/**
 * Check if domain has valid MX records (Node.js only)
 * Returns true if domain has MX records, false otherwise
 */
export async function hasMxRecords(domain: string): Promise<boolean> {
  try {
    const records = await dns.resolveMx(domain);
    return records && records.length > 0;
  } catch (error) {
    // Domain doesn't have MX records or DNS lookup failed
    return false;
  }
}

/**
 * Get MX records for a domain (Node.js only)
 */
export async function getMxRecords(
  domain: string
): Promise<{ exchange: string; priority: number }[]> {
  try {
    return await dns.resolveMx(domain);
  } catch (error) {
    return [];
  }
}
