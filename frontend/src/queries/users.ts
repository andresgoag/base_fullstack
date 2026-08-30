import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
import {
  activateAccount,
  changePassword,
  confirmPasswordReset,
  getCurrentUser,
  requestPasswordReset,
  resendActivation,
  updateProfile,
} from "api/users";
import { queryKeys } from "queries/queryKeys";
import type {
  ActivationData,
  ChangePasswordData,
  PasswordResetConfirmData,
  PasswordResetRequestData,
  ProfileUpdateData,
  User,
} from "models";

type ProfileUpdateContext = {
  previousUser: User | undefined;
};

type MutationCallbacks<Data, Variables> = Pick<
  UseMutationOptions<Data, Error, Variables>,
  "onSuccess"
>;

export const useCurrentUser = (
  isEnabled: boolean,
): UseQueryResult<User, Error> =>
  useQuery({
    queryKey: queryKeys.users.current(),
    queryFn: ({ signal }) => getCurrentUser({ signal }),
    enabled: isEnabled,
  });

export const useUpdateProfile = (
  callbacks: MutationCallbacks<User, ProfileUpdateData> = {},
): UseMutationResult<User, Error, ProfileUpdateData, ProfileUpdateContext> => {
  const queryClient = useQueryClient();

  return useMutation({
    ...callbacks,
    mutationFn: updateProfile,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.users.current() });
      const previousUser = queryClient.getQueryData<User>(
        queryKeys.users.current(),
      );
      if (previousUser) {
        queryClient.setQueryData<User>(queryKeys.users.current(), {
          ...previousUser,
          ...data,
        });
      }
      return { previousUser };
    },
    onError: (_error, _data, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.current(),
          context.previousUser,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.users.current(),
      });
    },
  });
};

export const useChangePassword = (
  callbacks: MutationCallbacks<void, ChangePasswordData> = {},
): UseMutationResult<void, Error, ChangePasswordData> =>
  useMutation({ ...callbacks, mutationFn: changePassword });

export const useRequestPasswordReset = (
  callbacks: MutationCallbacks<void, PasswordResetRequestData> = {},
): UseMutationResult<void, Error, PasswordResetRequestData> =>
  useMutation({ ...callbacks, mutationFn: requestPasswordReset });

export const useConfirmPasswordReset = (
  callbacks: MutationCallbacks<void, PasswordResetConfirmData> = {},
): UseMutationResult<void, Error, PasswordResetConfirmData> =>
  useMutation({ ...callbacks, mutationFn: confirmPasswordReset });

export const useActivateAccount = (
  callbacks: MutationCallbacks<void, ActivationData> = {},
): UseMutationResult<void, Error, ActivationData> =>
  useMutation({ ...callbacks, mutationFn: activateAccount });

export const useResendActivation = (
  callbacks: MutationCallbacks<void, PasswordResetRequestData> = {},
): UseMutationResult<void, Error, PasswordResetRequestData> =>
  useMutation({ ...callbacks, mutationFn: resendActivation });
