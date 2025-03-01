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
  password: string;
  confirmPassword: string;
};

export const resetPasswordMutationFn = async (data: ResetPasswordType) =>
  fetchWithAuth('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(data),
  });
