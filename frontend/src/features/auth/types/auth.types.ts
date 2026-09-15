import type { UserRole, AuthProvider } from '@/constants/app.constants';

// Core domain model 
export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role: UserRole;
  avatarUrl?: string | null;
  authProvider: AuthProvider;
}

// JWT payload (decoded client-side, not trusted for security decisions)
export interface JwtPayload {
  sub: string;          // user id
  username: string;
  role: UserRole;
  authProvider?: AuthProvider;  // included in token if backend sets it
  iat: number;
  exp: number;
}

// Request bodies 
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

// Response data
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
