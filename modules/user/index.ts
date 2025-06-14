// User Module V2 - Standardized exports
export { userService as UserService } from '@/services/user/user.service';
export { 
  useUser,
  useUserQueries,
  useUserMutations,
  useUserHelpers,
  initializeUserContext
} from '@/hooks/users/useUser';
export { 
  UserProvider,
  useUserContext,
  useUserFormWithDefaults as useUserForm 
} from '@/hooks/users/UserContext';
export { default as UserContainer } from '@/screens/admin/user/Container';
export { default as UserForm } from '@/screens/admin/user/form';

// Re-export types
export type { UserProfileType, UserListParams, UserUpdateRequest } from '@/common/interface/user';
export type { TUserSchema } from '@/schemas/user';
