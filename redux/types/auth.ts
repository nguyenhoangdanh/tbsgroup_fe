export interface User {
  id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: string;
  employeeId?: string;
  cardId?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  phone?: string;
  employeeId?: string;
  cardId?: string;
}

export interface VerifyRegistration {
  token: string;
  userId: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string | { message: string };
  message?: string;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
  expiresAt?: string;
  expiresIn?: number;
}

export type AuthStatus =
  | 'loading'
  | 'checking'
  | 'unauthenticated'
  | 'authenticated'
  | 'refreshing_token'
  | 'needs_password_reset'
  | 'password_reset_success'
  | 'registration_success'
  | 'session_expired';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  expiresAt: Date | null;
  resetPasswordData: {
    resetToken: string;
    username: string;
    message: string;
  } | null;
  isHydrated: boolean;
  sessionInitialized: boolean;
  lastSessionCheck: number | null;
}

export interface RequestResetParams {
  employeeId: string;
  cardId: string;
}

export interface ResetPasswordParams {
  token?: string;
  currentPassword?: string;
  newPassword: string;
}

// Export default types for easy importing
export type {
  User as UserType,
  AuthState as AuthStateType,
  LoginCredentials as LoginCredentialsType,
  RegisterCredentials as RegisterCredentialsType,
  AuthStatus as AuthStatusType,
};
