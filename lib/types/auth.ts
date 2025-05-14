// In auth.ts (types file)
export interface User {
  id: string;
  email: string;
  fullName: string;
  username: string;
  emailVerified: boolean;
  roles: string[];
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken?: string | null;
  expiresAt: Date | null;
  refreshExpiresAt?: Date | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  fullName: string;
}

export interface VerifyRegistration {
  username: string;
  code: string;
}


export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  refreshExpiresAt?: Date;
}

interface IError {
  error: string;
  message: string;
  statusCode: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: IError | string;
}

export interface RoleWithPermissions {
  id: string;
  name: string;
  description: string;
  permissions: {
    id: string;
    name: string;
    description: string;
  }[];
}

export interface SessionState {
  id: string;
  token: string;
  expiresAt: Date;
  isActive: boolean;
  deviceInfo?: {
    deviceId: string;
    deviceType: string;
    browserInfo: string;
    osInfo: string;
    ipAddress: string;
  };
}
