export type ItemType = 'multiple_choice' | 'poll' | 'short_answer' | 'info';

export interface Worksheet {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
}

export interface WorksheetItem {
  id: string;
  worksheet_id: string;
  type: ItemType;
  position: number;
  prompt: string;
  options: string[];
  answer: unknown;
  settings: Record<string, unknown>;
}

export interface WorksheetWithItems {
  worksheet: Worksheet;
  items: WorksheetItem[];
}
