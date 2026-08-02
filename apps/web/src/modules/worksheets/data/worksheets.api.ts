import { supabase } from '@/shared/lib/supabase';
import { likeTerm } from '@/shared/lib/utils';
import type { ItemType, Worksheet, WorksheetItem, WorksheetWithItems } from '../types/worksheet.types';

export async function listWorksheets(scope: 'mine' | 'library', search?: string): Promise<Worksheet[]> {
  let query = supabase.from('worksheets').select('*').is('deleted_at', null);
  if (scope === 'mine') {
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user) query = query.eq('owner_id', auth.user.id);
  } else {
    query = query.eq('is_published', true);
  }
  if (search?.trim()) {
    const term = likeTerm(search);
    if (term) query = query.ilike('title', `%${term}%`);
  }
  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return data as Worksheet[];
}

export async function getWorksheet(id: string): Promise<WorksheetWithItems | null> {
  const { data: ws, error } = await supabase.from('worksheets').select('*').eq('id', id).is('deleted_at', null).maybeSingle();
  if (error) throw error;
  if (!ws) return null;
  const { data: items, error: itemsErr } = await supabase
    .from('worksheet_items')
    .select('*')
    .eq('worksheet_id', id)
    .order('position');
  if (itemsErr) throw itemsErr;
  return { worksheet: ws as Worksheet, items: (items as WorksheetItem[]) ?? [] };
}

export async function createWorksheet(title: string, description?: string): Promise<{ id: string }> {
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('worksheets')
    .insert({ owner_id: auth.user?.id, title, description: description ?? null })
    .select('id')
    .single();
  if (error) throw new Error('تعذّر إنشاء ورقة العمل.');
  return data as { id: string };
}

export async function updateWorksheet(
  id: string,
  patch: { title?: string; description?: string | null; is_published?: boolean },
): Promise<void> {
  const { error } = await supabase.from('worksheets').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteWorksheet(id: string): Promise<void> {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('worksheets')
    .update({ deleted_at: new Date().toISOString(), deleted_by: auth.user?.id })
    .eq('id', id);
  if (error) throw error;
}

const DEFAULT_PROMPT: Record<ItemType, string> = {
  multiple_choice: 'سؤال اختيار من متعدد',
  poll: 'سؤال تصويت',
  short_answer: 'سؤال بإجابة قصيرة',
  info: 'بطاقة معلومة',
};

export async function addItem(worksheetId: string, type: ItemType, position: number): Promise<void> {
  const options = type === 'multiple_choice' || type === 'poll' ? ['خيار 1', 'خيار 2'] : [];
  const answer = type === 'multiple_choice' ? 0 : null;
  const { error } = await supabase.from('worksheet_items').insert({
    worksheet_id: worksheetId,
    type,
    position,
    prompt: DEFAULT_PROMPT[type],
    options,
    answer,
  });
  if (error) throw error;
}

export async function updateItem(id: string, patch: Partial<Pick<WorksheetItem, 'prompt' | 'options' | 'answer' | 'position'>>): Promise<void> {
  const { error } = await supabase.from('worksheet_items').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteItem(id: string): Promise<void> {
  const { error } = await supabase.from('worksheet_items').delete().eq('id', id);
  if (error) throw error;
}
