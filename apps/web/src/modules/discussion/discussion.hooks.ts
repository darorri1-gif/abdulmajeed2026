import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './data/discussion.api';
import type { CreatePostInput } from './types/discussion.types';

export function useCategories() {
  return useQuery({ queryKey: ['disc-categories'], queryFn: api.listCategories });
}
export function usePosts(filters: { category?: string; search?: string; announcements?: boolean }) {
  return useQuery({ queryKey: ['disc-posts', filters], queryFn: () => api.listPosts(filters) });
}
export function usePost(id: string) {
  return useQuery({ queryKey: ['disc-post', id], queryFn: () => api.getPost(id), enabled: !!id });
}
export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePostInput) => api.createPost(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disc-posts'] }),
  });
}
export function useDeletePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePost(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disc-posts'] }),
  });
}
export function useSetPinned() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) => api.setPinned(id, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disc-posts'] }),
  });
}
export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => api.toggleReaction(postId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disc-posts'] }),
  });
}
export function useComments(postId: string) {
  return useQuery({ queryKey: ['disc-comments', postId], queryFn: () => api.listComments(postId), enabled: !!postId });
}
export function useAddComment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => api.addComment(postId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disc-comments', postId] }),
  });
}
export function useAttachments(postId: string) {
  return useQuery({ queryKey: ['disc-attachments', postId], queryFn: () => api.listAttachments(postId), enabled: !!postId });
}
export function useUploadAttachment(postId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => api.uploadAttachment(postId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['disc-attachments', postId] }),
  });
}
