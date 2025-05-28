'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as CryptoJS from 'crypto-js';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useCallback, useEffect } from 'react';

import useAppDispatch from './redux/useAppDispatch';
import useAppSelector from './redux/useAppSelector';

import { fetchRoles } from '@/apis/roles/role.api';
import {
  loginMutationFn,
  logoutMutationFn,
  resetPasswordMutationFn,
  requestResetPasswordMutationFn,
  getUserProfileQueryFn,
  updateStatusMutationFn,
  registerMutationFn,
} from '@/apis/user/user.api';
import { UserStatusEnum } from '@/common/enum';
import { toast } from 'react-toast-kit';
import { login, logout } from '@/redux/actions/authAction';

const ENCRYPTION_KEY =
  process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'default-secure-key-change-in-production';

const encryptData = (data: any): string => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), ENCRYPTION_KEY).toString();
};

const decryptData = (encryptedData: string): any => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Không thể giải mã dữ liệu:', error);
    return null;
  }
};

type MinimalUserInfo = {
  id: string;
  username: string;
  role: string;
  status: string;
};

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  roleId: string;
  position: string;
  department: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  userPreferences: {
    enable2FA: boolean;
  };
  employeeId: string;
  cardId: string;
  status: string;
  factoryId: string | null;
  lineId: string | null;
  teamId: string | null;
  groupId: string | null;
};

interface ApiResponse<T> {
  data: T;
  message: string;
  statusCode: number;
  success: boolean;
}

type LoginCredentials = {
  username: string;
  password: string;
};

type ResetPasswordParams = {
  resetToken?: string;
  username?: string;
  password: string;
  confirmPassword: string;
};

type RequestResetParams = {
  employeeId: string;
  cardId: string;
};

interface RequestResetResponse {
  success: boolean;
  data: {
    resetToken: string;
    username: string;
    expiryDate: string;
    message: string;
  };
}

const TOKEN_KEY = 'auth-token';
const USER_DATA_KEY = 'auth-user-minimal';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 phút

/**
 * useAuthManager - Centralized hook to manage all authentication-related functionality
 */
export const useAuthManager = () => {
  const router = useRouter();
  const auth = useAppSelector(state => state.auth);
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [isLoggedOut, setIsLoggedOut] = useState(false);
  const [lastActivity, setLastActivity] = useState<number>(Date.now());

  // Initialize local state for auth token and minimal user info
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [minimalUserInfo, setMinimalUserInfo] = useState<MinimalUserInfo | null>(null);

  //  Load minimal cached user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const encryptedToken = localStorage.getItem(TOKEN_KEY);
        const encryptedUserData = localStorage.getItem(USER_DATA_KEY);

        if (encryptedToken) {
          setAuthToken(encryptedToken);
        }

        if (encryptedUserData) {
          const decryptedData = decryptData(encryptedUserData);
          setMinimalUserInfo(decryptedData);
        }
      } catch (e) {
        console.error('Error loading cached auth data:', e);
        //  Xóa dữ liệu cục bộ nếu có lỗi khi giải mã
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_DATA_KEY);
      }
    }
  }, []);

  //  Thiết lập theo dõi hoạt động người dùng để quản lý thời gian phiên
  useEffect(() => {
    const updateLastActivity = () => {
      setLastActivity(Date.now());
    };

    // Theo dõi các sự kiện người dùng để cập nhật lastActivity
    window.addEventListener('mousemove', updateLastActivity);
    window.addEventListener('keydown', updateLastActivity);
    window.addEventListener('click', updateLastActivity);
    window.addEventListener('scroll', updateLastActivity);

    // Kiểm tra phiên hoạt động đã hết hạn hay chưa
    const checkSessionTimeout = setInterval(() => {
      const now = Date.now();
      // Only logout if authenticated and not on public pages
      if (
        now - lastActivity > SESSION_TIMEOUT &&
        authToken &&
        !location.pathname.includes('/login')
      ) {
        // Phiên đã hết hạn, đăng xuất tự động
        // if (!isLoggedOut) {
        //   handleLogout(true);
        // }
        toast({
          title: 'Phiên đã hết hạn',
          description: 'Bạn đã tự động đăng xuất do không hoạt động trong thời gian dài',
        });
      }
    }, 60000); // Kiểm tra mỗi phút

    return () => {
      window.removeEventListener('mousemove', updateLastActivity);
      window.removeEventListener('keydown', updateLastActivity);
      window.removeEventListener('click', updateLastActivity);
      window.removeEventListener('scroll', updateLastActivity);
      clearInterval(checkSessionTimeout);
    };
  }, [lastActivity, authToken]);

  // Type for the useQuery result
  type UserQueryResult = {
    data?: ApiResponse<AuthUser>;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<any>;
  };

  // Initialize local state for cached user
  const [localCachedUser, setLocalCachedUser] = useState<AuthUser | null>(null);

  //  Load cached user from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cachedData = localStorage.getItem('auth-user');
        if (cachedData) {
          setLocalCachedUser(JSON.parse(cachedData) as AuthUser);
        }
      } catch (e) {
        console.error('Error loading cached user:', e);
      }
    }
  }, []);

  //  Fetch user profile data with optimizations
  const userQuery = useQuery({
    queryKey: ['authUser'],
    queryFn: getUserProfileQueryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !isLoggedOut,
    initialData: localCachedUser
      ? {
          data: localCachedUser,
          success: true,
          statusCode: 200,
          message: 'Cached data',
        }
      : undefined,
  }) as UserQueryResult;

  // Lưu dữ liệu token và thông tin người dùng tối thiểu vào localStorage khi thay đổi
  useEffect(() => {
    if (userQuery.data?.data && typeof window !== 'undefined') {
      const userData = userQuery.data.data;

      //   Chỉ lưu thông tin tối thiểu cần thiết
      const minimalData: MinimalUserInfo = {
        id: userData.id || '',
        username: userData.username,
        role: userData.role,
        status: userData.status,
      };

      // Mã hóa và lưu trữ dữ liệu
      localStorage.setItem(USER_DATA_KEY, encryptData(minimalData));
      setMinimalUserInfo(minimalData);
    }
  }, [userQuery.data]);

  //Sử dụng dữ liệu người dùng từ query
  const user = isLoggedOut ? null : userQuery.data?.data || null;

  // Kiểm tra xem người dùng đã xác thực hay chưa
  // const isAuthenticated = !!user && !!authToken && !isLoggedOut;
  // const isAuthenticated = auth.status === 'authenticated' && !isLoggedOut;

  // User status check helpers
  const needsPasswordReset = user?.status === UserStatusEnum.PENDING_ACTIVATION;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginMutationFn,
    onSuccess: () => {
      setIsLoggedOut(false);
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
    },
  });

  const fetchAllRoles = useMutation({
    mutationFn: fetchRoles,
    onSuccess: data => {
      console.log('Danh sách roles:', data);
    },
    onError: error => {
      console.error('Lỗi khi lấy dữ liệu vai trò:', error);
    },
  });

  const registerUserMutation = useMutation({
    mutationFn: registerMutationFn,
  });

  // Logout mutation
  // const logoutMutation = useMutation({
  //   mutationFn: logoutMutationFn,
  // });

  // Request password reset token
  const requestPasswordResetMutation = useMutation({
    mutationFn: requestResetPasswordMutationFn,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: resetPasswordMutationFn,
  });

  //  Update user status
  const updateStatusMutation = useMutation({
    mutationFn: updateStatusMutationFn,
  });

  /**
   * Handles login process with appropriate error handling
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials, opts?: { message?: string }) => {
      const { message } = opts || {};
      try {
        //  Reset logged out state when attempting to login
        setIsLoggedOut(false);

        //  Await the login mutation to catch errors
        const response = await loginMutation.mutateAsync(credentials);
        const { data } = response;

        if (data.token) {
          localStorage.setItem(TOKEN_KEY, String(data.token));
          setAuthToken(String(data.token));
        }

        //  Check if password reset is required
        if (data.requiredResetPassword) {
          toast({
            title: 'Cần đổi mật khẩu',
            description: 'Bạn cần đổi mật khẩu trước khi tiếp tục',
          });
          router.push('/reset-password');
        } else {
          toast({
            title: 'Thành công',
            description: message || 'Đăng nhập thành công',
          });
          window.location.href = '/home';
        }

        return response;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Đăng nhập thất bại',
          variant: 'error',
        });
        throw error;
      }
    },
    [loginMutation, router],
  );

  const handleRegister = useCallback(
    async (data: any) => {
      try {
        const response = await registerUserMutation.mutateAsync(data);
        return response;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Đăng ký thất bại',
          variant: 'error',
        });
        throw error;
      }
    },
    [registerUserMutation],
  );

  /**
   * Handles password reset with proper error propagation
   */
  const handleResetPassword = useCallback(
    async (params: ResetPasswordParams): Promise<any> => {
      try {
        const response = await resetPasswordMutation.mutateAsync(params);

        toast({
          title: 'Thành công',
          description: 'Đổi mật khẩu thành công',
        });

        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ['authUser'] });

        return response;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Đổi mật khẩu thất bại',
          variant: 'error',
        });

        // Re-throw the error for the component to handle
        throw error;
      }
    },
    [resetPasswordMutation, queryClient],
  );

  /**
   * Handles request for password reset with proper error propagation
   */
  const handleRequestPasswordReset = useCallback(
    async (params: RequestResetParams): Promise<RequestResetResponse> => {
      try {
        const response = await requestPasswordResetMutation.mutateAsync(params);
        return response as RequestResetResponse;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Không thể yêu cầu đặt lại mật khẩu',
          variant: 'error',
        });

        //Re-throw the error for the component to handle
        throw error;
      }
    },
    [requestPasswordResetMutation],
  );

  /**
   * Handles updating user status with proper error propagation
   */
  const handleUpdateStatus = useCallback(
    async (params: any): Promise<any> => {
      try {
        const response = await updateStatusMutation.mutateAsync(params);

        // Refresh user data
        queryClient.invalidateQueries({ queryKey: ['authUser'] });

        return response;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Cập nhật trạng thái thất bại',
          variant: 'error',
        });

        // Re-throw the error for the component to handle
        throw error;
      }
    },
    [updateStatusMutation, queryClient],
  );

  // Check for authentication state on mount and redirect if needed
  useEffect(() => {
    // If we have a user and they need to reset their password, redirect
    if (user && needsPasswordReset && pathname !== '/reset-password') {
      router.replace('/reset-password');
    }
  }, [user, needsPasswordReset, router, pathname]);

  // Kiểm tra trạng thái xác thực khi mount và chuyển hướng nếu cần
  useEffect(() => {
    // Nếu chúng ta có người dùng và họ cần đặt lại mật khẩu, chuyển hướng
    if ((user || minimalUserInfo) && needsPasswordReset && pathname !== '/reset-password') {
      router.replace('/reset-password');
    }
  }, [user, minimalUserInfo, needsPasswordReset, router, pathname]);
  const loginWithCredentials = useCallback(
    (credentials: LoginCredentials) => {
      return dispatch(login(credentials));
    },
    [dispatch],
  );

  // Logout current user
  const logoutUser = useCallback(
    (options?: { reason?: string; allDevices?: boolean }) => {
      return dispatch(logout(options));
    },
    [dispatch],
  );

  return {
    // Auth state
    user: auth.user,
    status: auth.status,
    error: auth.error,
    accessToken: auth.accessToken,
    isAuthenticated: auth.status === 'authenticated',
    isLoading: auth.status === 'loading',

    needsPasswordReset,
    error: userQuery.error,
    login: handleLogin,
    logout: logoutUser,
    resetPassword: handleResetPassword,
    requestPasswordReset: handleRequestPasswordReset,
    updateStatus: handleUpdateStatus,
    refetchUser: userQuery.refetch,
    allRoles: fetchAllRoles,
    register: handleRegister,
    loginWithCredentials,
  };
};

export default useAuthManager;
