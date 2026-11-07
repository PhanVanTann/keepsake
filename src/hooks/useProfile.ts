import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { profileRepo, type UpdateProfileInput } from '@/data';

export function useProfile(enabled = true) {
  return useQuery({ queryKey: ['me'], queryFn: profileRepo.getMe, enabled });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: UpdateProfileInput) => profileRepo.updateProfile(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (localUri: string) => profileRepo.uploadAvatar(localUri),
  });
}

export function useRequestAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => profileRepo.requestAccountDeletion(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}

export function useCancelAccountDeletion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => profileRepo.cancelAccountDeletion(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
