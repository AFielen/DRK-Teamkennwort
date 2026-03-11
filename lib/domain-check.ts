/**
 * Validates that an email address belongs to one of the allowed domains.
 * Case-insensitive comparison.
 */
export function validateEmailDomain(
  email: string,
  allowedDomains: string[]
): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return allowedDomains.some((d) => d.toLowerCase() === domain);
}
