/**
 * Decode a JWT payload without verifying the signature.
 *
 * SECURITY NOTE: The backend is the source of truth for JWT verification.
 * This utility is used CLIENT-SIDE ONLY to extract non-sensitive display
 * data (username, role) from a token that has already been cryptographically
 * verified by the backend. Never make security decisions based on this output.
 */

import type { JwtPayload } from '@/features/auth/types/auth.types';

export function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payloadB64] = token.split('.');
    if (!payloadB64) return null;
    // Convert base64url → base64 → string
    const padded = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Returns true if the given JWT token is expired (based on the `exp` claim).
 * Adds a 10-second safety buffer to account for clock skew.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  const bufferSeconds = 10;
  return Date.now() / 1000 >= payload.exp - bufferSeconds;
}
