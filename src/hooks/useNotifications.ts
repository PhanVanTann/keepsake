import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationRepo } from '@/data';

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: notificationRepo.getNotifications });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationRepo.markRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
