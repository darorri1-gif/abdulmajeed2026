export interface DiscussionCategory {
  id: string;
  name_ar: string;
  sort_order: number;
  is_active: boolean;
}

export interface PostListItem {
  id: string;
  title: string;
  body: string | null;
  author_name: string;
  category_name: string | null;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  comment_count: number;
  reaction_count: number;
  reacted: boolean;
}

export interface PostDetail {
  id: string;
  title: string;
  body: string | null;
  author_id: string;
  category_id: string | null;
  is_pinned: boolean;
  is_announcement: boolean;
  created_at: string;
  author?: { full_name: string } | null;
  category?: { name_ar: string } | null;
}

export interface DiscussionComment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { full_name: string } | null;
}

export interface CreatePostInput {
  title: string;
  body?: string;
  category_id?: string | null;
  is_announcement?: boolean;
}

export interface DiscussionAttachment {
  id: string;
  storage_path: string;
  original_name: string;
  mime_type: string | null;
  file_size: number | null;
}
