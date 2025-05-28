export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  emailVerified: boolean;
  roles: string[];
  avatarUrl?: string;
  permissions?: string[];
  cardId: string;
  employeeId: string;
  factoryId: string | null;
  lineId: string | null;
  teamId: string | null;
  groupId: string | null;
  positionId: string | null;
  status: string;
  role: string;
  roleId: string;
  avatar: string;
}

// Updated AuthState type with all possible status values
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  expiresAt: string | null; // ISO string for serialization
  status:
    | 'loading'
    | 'authenticated'
    | 'unauthenticated'
    | 'refreshing_token'
    | 'refresh_needed'
    | 'registration_success'
    | 'requesting_reset'
    | 'reset_requested'
    | 'reset_request_failed'
    | 'resetting_password'
    | 'password_reset_success'
    | 'password_reset_failed'
    | 'updating_profile'
    | 'needs_password_reset'
    | 'session_expired'
    | null;
  error: string | null;
}

// Update LoginCredentials in auth.ts
export interface LoginCredentials {
  username: string;
  password: string;
  securityInfo?: {
    timestamp: string;
    deviceInfo: {
      userAgent: string;
      language: string;
      screenSize: string;
      timeZone: string;
    };
  };
}

export interface RegisterCredentials {
  email: string;
  password: string;
  fullName: string;
  redirectTo?: string;
}

export interface VerifyRegistration {
  email: string;
  code: string;
}

export interface AuthResponse {
  data: User;
  token: string;
  expiresIn: number;
  expiresAt?: string; // ISO string
  requiredResetPassword?: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?:
    | {
        error: string;
        message: string;
        statusCode: number;
      }
    | string;
}

export interface TwoFactorAuthData {
  tempToken: string;
  method: '2fa_app' | '2fa_sms';
}

export interface VerifyTwoFactorData {
  tempToken: string;
  code: string;
}

export interface RequestResetParams {
  employeeId: string;
  cardId: string;
}

export interface ResetPasswordParams {
  resetToken?: string;
  username?: string;
  password: string;
  confirmPassword: string;
}
