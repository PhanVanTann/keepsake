import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { friendRepo } from '@/data';

export function useFriends() {
  return useQuery({ queryKey: ['friends'], queryFn: friendRepo.getFriends });
}

export function useIncomingFriendRequests() {
  return useQuery({ queryKey: ['friendRequests'], queryFn: friendRepo.getIncomingRequests });
}

export function useRespondToFriendRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, accept }: { requestId: string; accept: boolean }) =>
      friendRepo.respondToRequest(requestId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendRequests'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useSendFriendRequest() {
  return useMutation({
    mutationFn: (userId: string) => friendRepo.sendFriendRequest(userId),
  });
}

export function useAddFriendDirect() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => friendRepo.addFriendDirect(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] });
    },
  });
}

export function useCreateInviteLink() {
  return useMutation({
    mutationFn: () => friendRepo.createInviteLink(),
  });
}
