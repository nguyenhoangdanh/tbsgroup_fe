import {fetchWithAuth} from '@/lib/fetcher';

type LoginType = {
  username: string;
  password: string;
};

export const loginMutationFn = async (data: LoginType) =>
  fetchWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  });

type ResetPasswordType = {
  password?: string;
  confirmPassword?: string;
  employeeId?: string;
  cardId?: string;
  username?: string;
};

export type VerifyDataType = {
  employeeId: string;
  cardId: string;
};

export const verifyMutationFn = async (data: VerifyDataType) =>
  fetchWithAuth('/auth/verify', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const resetPasswordMutationFn = async (data: ResetPasswordType) =>
  fetchWithAuth('/auth/reset-password', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const updateStatusMutationFn = async (data: {status: string}) =>
  fetchWithAuth('/profile', {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const logoutMutationFn = async () => fetchWithAuth('/auth/logout', {
  method: 'POST',
});

export const getUserProfileQueryFn = async () => fetchWithAuth('/profile');
