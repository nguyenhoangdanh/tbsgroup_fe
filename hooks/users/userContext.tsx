'use client';

import React, { createContext, useContext, ReactNode } from 'react';

import { initializeUserContext } from './useUser';

import { UserStatusEnum } from '@/common/enum';
import { UserProfileType, UserUpdateRequest } from '@/common/interface/user';
import { TUserSchema } from '@/schemas/user';

// Create user context with type definitions
type UserContextType = ReturnType<typeof initializeUserContext>;

const UserContext = createContext<UserContextType | null>(null);

// Props for the provider component
interface UserProviderProps {
  children: ReactNode;
}

/**
 * Provider component for global user state management
 */
export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  // Initialize the user context state
  const userState = initializeUserContext();

  return <UserContext.Provider value={userState}>{children}</UserContext.Provider>;
};

/**
 * Hook to access the user context
 * Will throw an error if used outside of a UserProvider
 */
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }

  return context;
};

/**
 * Create user form state hook
 * Extracted for performance - only re-renders when form data changes
 */
export const useUserForm = () => {
  const [formData, setFormData] = React.useState<Omit<TUserSchema, 'id'>>({
    username: '',
    fullName: '',
    password: 'Abc@123',
    roleId: '',
    employeeId: '',
    cardId: '',
    status: UserStatusEnum.PENDING_ACTIVATION,
  });

  // Function to update form fields
  const updateFormField = React.useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // Function to reset the form
  const resetForm = React.useCallback(() => {
    setFormData({
      username: '',
      fullName: '',
      roleId: '',
      employeeId: '',
      cardId: '',
      password: 'Abc@123',
      status: UserStatusEnum.PENDING_ACTIVATION,
    });
  }, []);

  // Function to load data into the form for editing
  const loadUserData = React.useCallback((user: UserProfileType) => {
    if (user) {
      setFormData({
        username: user.username,
        password: 'Abc@123', // Don't load actual password for security
        fullName: user.fullName || '',
        roleId: user.roleId || '',
        employeeId: user.employeeId || '',
        cardId: user.cardId || '',
        status: user.status || UserStatusEnum.PENDING_ACTIVATION,
      });
    }
  }, []);

  // Function to convert form data to update request format
  const toUpdateRequest = React.useCallback((data: TUserSchema): UserUpdateRequest => {
    // Remove password from update request (handled separately)
    const { password, ...updateData } = data;
    return updateData;
  }, []);

  return {
    formData,
    updateFormField,
    resetForm,
    loadUserData,
    toUpdateRequest,
  };
};
