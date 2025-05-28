/**
 * API Response type definitions
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ApiListResponse<T = any> {
  success: boolean;
  data?: T[];
  total?: number;
  page?: number;
  limit?: number;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserInfo {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  avatar?: string;
  settings?: UserSettings;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  [key: string]: any;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

export interface PasswordResetRequest {
  token: string;
  password: string;
  securityInfo?: any;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface ErrorResponse {
  status: number;
  message?: string;
  error?: string;
}

// Auth state
export interface AuthState {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Permissions and roles
export type Permission = string;
export type Role = string;

export interface RoleWithPermissions {
  name: string;
  permissions: Permission[];
}
