// routes
export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
} as const;

//  
export const USERNAME_CONSTRAINTS = {
  MIN: 3,
  MAX: 20,
  PATTERN: /^[a-z0-9_]+$/,
} as const;

// User roles
export const USER_ROLES = {
  USER: 'USER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Auth providers 
export const AUTH_PROVIDERS = {
  LOCAL: 'local',
} as const;

export type AuthProvider = (typeof AUTH_PROVIDERS)[keyof typeof AUTH_PROVIDERS];