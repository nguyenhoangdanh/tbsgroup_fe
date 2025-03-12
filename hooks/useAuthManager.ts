// hooks/useAuthManager.ts

"use client";
import {useState, useCallback, useEffect} from 'react';
import {useRouter, usePathname} from 'next/navigation';
import {useMutation, useQueryClient, useQuery} from '@tanstack/react-query';
import {toast} from '@/hooks/use-toast';
import {
  loginMutationFn,
  logoutMutationFn,
  resetPasswordMutationFn,
  requestResetPasswordMutationFn,
  getUserProfileQueryFn,
  updateStatusMutationFn,
} from '@/apis/user/user.api';
import {UserStatusEnum} from '@/common/enum';

export type AuthUser = {
  username: string;
  email: string;
  isEmailVerified: boolean;
  role: string;
  position: string;
  department: string;
  fullName: string;
  createdAt: Date;
  updatedAt: Date;
  avatar?: string;
  userPreferences: {
    enable2FA: boolean;
  };
  employeeId?: string;
  cardId?: string;
  status: string;
};

// Định nghĩa kiểu dữ liệu trả về từ API
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

// Định nghĩa kiểu dữ liệu đầu ra cho requestPasswordReset
interface RequestResetResponse {
  success: boolean;
  data: {
    resetToken: string;
    username: string;
    expiryDate: string;
    message: string;
  };
}

/**
 * useAuthManager - Centralized hook to manage all authentication-related functionality
 */
export const useAuthManager = () => {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedOut, setIsLoggedOut] = useState(false);

  // Type for the useQuery result
  type UserQueryResult = {
    data?: ApiResponse<AuthUser>;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<any>;
  };

  // Fetch user profile data
  const userQuery = useQuery({
    queryKey: ['authUser'],
    queryFn: getUserProfileQueryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
    enabled: !isLoggedOut,
  }) as UserQueryResult;

  const {
    data: userData,
    isLoading: isLoadingProfile,
    error: profileError,
    refetch: refetchUser,
  } = userQuery;

  const user = isLoggedOut ? null : userData?.data || null;

  // Check if user is authenticated
  const isAuthenticated = !!user && !isLoggedOut;

  // User status check helpers
  const needsPasswordReset = user?.status === UserStatusEnum.PENDING_ACTIVATION;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: loginMutationFn,
    onSuccess: () => {
      setIsLoggedOut(false);
      queryClient.invalidateQueries({queryKey: ['authUser']});
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: logoutMutationFn,
  });

  // Request password reset token
  const requestPasswordResetMutation = useMutation({
    mutationFn: requestResetPasswordMutationFn,
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: resetPasswordMutationFn,
  });

  // Update user status
  const updateStatusMutation = useMutation({
    mutationFn: updateStatusMutationFn,
  });

  /**
   * Handles login process with appropriate error handling
   */
  const handleLogin = useCallback(
    async (credentials: LoginCredentials, opts?: {message?: string}) => {
      setIsLoading(true);
      const {message} = opts || {};
      try {
        // Reset logged out state when attempting to login
        setIsLoggedOut(false);

        // Await the login mutation to catch errors
        const response = await loginMutation.mutateAsync(credentials);
        const {data} = response;

        // Check if password reset is required
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
        // Show toast notification
        toast({
          title: 'Lỗi',
          description: error.message || 'Đăng nhập thất bại',
          variant: 'destructive',
        });

        // Re-throw the error for the component to handle
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [loginMutation, router],
  );

  /**
   * Handles logout with proper error propagation
   */
  const handleLogout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call the logout API
      await logoutMutation.mutateAsync();

      // Even on success, manually clean up
      setIsLoggedOut(true);
      queryClient.setQueryData(['authUser'], null);
      queryClient.resetQueries();
      queryClient.clear();

      router.push('/login');

      toast({
        title: 'Đăng xuất',
        description: 'Đăng xuất thành công',
      });
    } catch (error: any) {
      // Still perform cleanup on error
      setIsLoggedOut(true);
      queryClient.setQueryData(['authUser'], null);
      queryClient.resetQueries();
      queryClient.clear();

      router.push('/login');

      toast({
        title: 'Lỗi',
        description: error.message || 'Đăng xuất thất bại',
        variant: 'destructive',
      });

      // Re-throw the error for the component to handle
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [logoutMutation, queryClient, router]);

  /**
   * Handles password reset with proper error propagation
   */
  const handleResetPassword = useCallback(
    async (params: ResetPasswordParams): Promise<any> => {
      setIsLoading(true);
      try {
        const response = await resetPasswordMutation.mutateAsync(params);

        toast({
          title: 'Thành công',
          description: 'Đổi mật khẩu thành công',
        });

        // Refresh user data
        queryClient.invalidateQueries({queryKey: ['authUser']});

        return response;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Đổi mật khẩu thất bại',
          variant: 'destructive',
        });

        // Re-throw the error for the component to handle
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [resetPasswordMutation, queryClient],
  );

  /**
   * Handles request for password reset with proper error propagation
   */
  const handleRequestPasswordReset = useCallback(
    async (params: RequestResetParams): Promise<RequestResetResponse> => {
      setIsLoading(true);
      try {
        const response = await requestPasswordResetMutation.mutateAsync(params);
        return response as RequestResetResponse;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Không thể yêu cầu đặt lại mật khẩu',
          variant: 'destructive',
        });

        // Re-throw the error for the component to handle
        throw error;
      } finally {
        setIsLoading(false);
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
        queryClient.invalidateQueries({queryKey: ['authUser']});

        return response;
      } catch (error: any) {
        toast({
          title: 'Lỗi',
          description: error.message || 'Cập nhật trạng thái thất bại',
          variant: 'destructive',
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

  return {
    user,
    isAuthenticated,
    needsPasswordReset,
    isLoading: isLoading || isLoadingProfile,
    error: profileError,
    login: handleLogin,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    requestPasswordReset: handleRequestPasswordReset,
    updateStatus: handleUpdateStatus,
    refetchUser,
  };
};

export default useAuthManager;
