import type { UserRole } from '@/constants/app.constants';

// Core domain model — mirrors the backend's UserDTO exactly.
//
// `id`, `username`, `role`, `mustChangePassword` are guaranteed present at all
// times: they're the only fields carried in the JWT, so `restoreSession` (a
// silent /auth/refresh on page load) can always populate them. The remaining
// fields come from the full UserDTO returned by /auth/login and
// /auth/change-password, but /auth/refresh does NOT return a user object —
// so after a page refresh these stay `undefined` for a moment until
// `GET /profile` (fetched by the Topbar) fills them in via `updateUser`.
export interface AuthUser {
  id: string;
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
  email?: string;
  photoUrl?: string | null;
  authProvider?: string;
  createdAt?: string;
  updatedAt?: string;
}

// JWT access-token payload (decoded client-side, not trusted for security
// decisions). Exactly the claims signAccessToken embeds — no more, no less.
export interface JwtPayload {
  sub: string; // user id
  username: string;
  role: UserRole;
  mustChangePassword: boolean;
  iat: number;
  exp: number;
}

// Request bodies
export interface LoginRequest {
  username: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

// Response data — shared by /auth/login and /auth/change-password, both of
// which return a fresh accessToken + the full user object.
export interface AuthResponseData {
  accessToken: string;
  user: AuthUser;
}

// Redux auth state
export interface AuthState {
  user: AuthUser | null;
  // True after the initial silent refresh attempt on mount (success or failure)
  isInitialized: boolean;
}
