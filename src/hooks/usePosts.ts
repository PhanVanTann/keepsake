import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { postRepo, type CreatePostInput } from '@/data';
import type { Post, ReactionEmoji } from '@/types';

export function useFeed() {
  return useQuery({ queryKey: ['feed'], queryFn: postRepo.getFeed });
}

export function useMyPosts() {
  return useQuery({ queryKey: ['myPosts'], queryFn: postRepo.getMyPosts });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ['post', postId],
    queryFn: async () => (await postRepo.getPost(postId)) ?? null,
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => postRepo.createPost(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}

type UpdatePostPatch = Partial<Pick<Post, 'amount' | 'content' | 'privacy' | 'selectedFriendIds'>> & {
  categoryId?: string;
};

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, patch }: { postId: string; patch: UpdatePostPatch }) =>
      postRepo.updatePost(postId, patch),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['currentCycle'] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => postRepo.deletePost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      // Xoá bài kéo theo khoản chi đi kèm (expenseRepo lọc theo post.deletedAt).
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction'] });
      queryClient.invalidateQueries({ queryKey: ['currentCycle'] });
    },
  });
}

export function useMarkPostViewed() {
  return useMutation({
    mutationFn: (postId: string) => postRepo.markViewed(postId),
  });
}

export function useReactToPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: ReactionEmoji }) =>
      postRepo.reactToPost(postId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed'] });
      queryClient.invalidateQueries({ queryKey: ['myPosts'] });
    },
  });
}
