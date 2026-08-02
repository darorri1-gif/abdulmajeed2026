import { supabase } from '@/shared/lib/supabase';
import type {
  CreatePostInput,
  DiscussionAttachment,
  DiscussionCategory,
  DiscussionComment,
  PostDetail,
  PostListItem,
} from '../types/discussion.types';

export async function listCategories(): Promise<DiscussionCategory[]> {
  const { data, error } = await supabase.from('discussion_categories').select('*').eq('is_active', true).order('sort_order');
  if (error) throw error;
  return data as DiscussionCategory[];
}

export async function listPosts(filters: { category?: string; search?: string; announcements?: boolean }): Promise<PostListItem[]> {
  const { data, error } = await supabase.rpc('list_discussion_posts', {
    p_category: filters.category || null,
    p_search: filters.search?.trim() || null,
    p_announcements: filters.announcements ?? false,
  });
  if (error) throw error;
  return (data as PostListItem[]) ?? [];
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const { data, error } = await supabase
    .from('discussion_posts')
    .select(
      'id, title, body, author_id, category_id, is_pinned, is_announcement, created_at, author:profiles!discussion_posts_author_id_fkey(full_name), category:discussion_categories(name_ar)',
    )
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return (data as unknown as PostDetail) ?? null;
}

export async function createPost(input: CreatePostInput): Promise<{ id: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('discussion_posts')
    .insert({
      author_id: auth.user?.id,
      title: input.title,
      body: input.body ?? null,
      category_id: input.category_id ?? null,
      is_announcement: input.is_announcement ?? false,
    })
    .select('id')
    .single();
  if (error) throw new Error('تعذّر نشر الموضوع.');
  return data as { id: string };
}

export async function deletePost(id: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('discussion_posts')
    .update({ deleted_at: new Date().toISOString(), deleted_by: auth.user?.id })
    .eq('id', id);
  if (error) throw error;
}

export async function setPinned(id: string, pinned: boolean): Promise<void> {
  const { error } = await supabase.from('discussion_posts').update({ is_pinned: pinned }).eq('id', id);
  if (error) throw error;
}

export async function toggleReaction(postId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('toggle_post_reaction', { p_post_id: postId });
  if (error) throw error;
  return data as boolean;
}

export async function listComments(postId: string): Promise<DiscussionComment[]> {
  const { data, error } = await supabase
    .from('discussion_comments')
    .select('id, post_id, author_id, body, created_at, author:profiles!discussion_comments_author_id_fkey(full_name)')
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at');
  if (error) throw error;
  return data as unknown as DiscussionComment[];
}

export async function addComment(postId: string, body: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase.from('discussion_comments').insert({ post_id: postId, author_id: auth.user?.id, body });
  if (error) throw error;
}

/* Attachments */
export async function listAttachments(postId: string): Promise<DiscussionAttachment[]> {
  const { data, error } = await supabase
    .from('discussion_attachments')
    .select('id, storage_path, original_name, mime_type, file_size')
    .eq('post_id', postId)
    .order('created_at');
  if (error) throw error;
  return data as DiscussionAttachment[];
}

export async function uploadAttachment(postId: string, file: File): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error('لا توجد جلسة صالحة.');
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const path = `${uid}/${postId}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('discussion').upload(path, file);
  if (upErr) throw new Error('تعذّر رفع الملف.');
  const { error } = await supabase.from('discussion_attachments').insert({
    post_id: postId,
    storage_path: path,
    original_name: file.name,
    mime_type: file.type || null,
    file_size: file.size,
    uploaded_by: uid,
  });
  if (error) throw error;
}

export async function getAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage.from('discussion').createSignedUrl(path, 120);
  if (error || !data) throw new Error('تعذّر فتح الملف.');
  return data.signedUrl;
}
