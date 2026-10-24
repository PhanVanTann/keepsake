import { useMutation, useQueryClient } from '@tanstack/react-query';

import { moderationRepo } from '@/data';
import type { ReportReason } from '@/types';

export function useReportPost() {
  return useMutation({
    mutationFn: ({ postId, reason }: { postId: string; reason: ReportReason }) =>
      moderationRepo.reportPost(postId, reason),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => moderationRepo.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['friends'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
