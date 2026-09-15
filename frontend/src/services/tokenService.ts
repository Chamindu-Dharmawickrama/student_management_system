/*
 * Security model:
 * - It lives in this module-scoped variable, wiped on page reload.
 * - Session is restored on reload by sending the httpOnly refresh cookie to /auth/refresh.
 */

let _accessToken: string | null = null;

export const tokenService = {
   // Returns the current in-memory access token, or null if not set
   getToken(): string | null {
      return _accessToken;
   },

   // Stores the access token in memory
   setToken(token: string): void {
      _accessToken = token;
   },

   // Clears the in-memory access token
   clearToken(): void {
      _accessToken = null;
   },

   // Returns true if an access token is currently held
   hasToken(): boolean {
      return _accessToken !== null;
   },
} as const;
