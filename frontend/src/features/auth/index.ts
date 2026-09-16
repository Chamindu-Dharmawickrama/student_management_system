// API
export {
   authApi,
   useLoginMutation,
   useChangePasswordMutation,
   useLogoutMutation,
   useLogoutAllMutation,
   useForgotPasswordMutation,
   useResetPasswordMutation,
} from './api/authApi';

// Slice
export {
   default as authReducer,
   restoreSession,
   setCredentials,
   logout,
   updateUser,
   selectUser,
   selectIsInitialized,
   selectIsAuthenticated,
   selectIsAdmin,
   selectIsTeacher,
   selectIsStudent,
   selectMustChangePassword,
} from './slices/authSlice';

// Validation
export {
   loginSchema,
   changePasswordSchema,
   forgotPasswordSchema,
   resetPasswordSchema,
   getPasswordStrength,
} from './validation/auth.schemas';
export type {
   LoginFormData,
   ChangePasswordFormData,
   ForgotPasswordFormData,
   ResetPasswordFormData,
   PasswordStrength,
} from './validation/auth.schemas';

// Types
export type {
   AuthUser,
   JwtPayload,
   LoginRequest,
   ChangePasswordRequest,
   ForgotPasswordRequest,
   ResetPasswordRequest,
   AuthResponseData,
   AuthState,
} from './types/auth.types';
