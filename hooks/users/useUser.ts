import { UserStatusEnum } from '@/common/enum';
import { UserProfileType, UserListParams, UserUpdateRequest } from '@/common/interface/user';
import { createEntityHooks } from '@/lib/core/hook-factory';
import { TUserSchema } from '@/schemas/user';
import { userService } from '@/services/user/user.service';

const defaultUserValues = (): Omit<TUserSchema, 'id'> => ({
  username: '',
  password: 'Abc@123',
  fullName: '',
  employeeId: '',
  cardId: '',
  roleId: '',
  status: UserStatusEnum.PENDING_ACTIVATION,
});

export const {
  useQueries: useUserQueries,
  useMutations: useUserMutations,
  useHelpers: useUserHelpers,
  useEntity: useUser,
} = createEntityHooks<
  UserProfileType,
  UserListParams,
  Omit<TUserSchema, 'id'>,
  UserUpdateRequest
>('user', userService, defaultUserValues);

// Initialize user context function
export const initializeUserContext = () => {
  return useUser();
};
