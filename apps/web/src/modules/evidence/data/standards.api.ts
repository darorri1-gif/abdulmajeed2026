import { supabase } from '@/shared/lib/supabase';
import type { Standard, StandardIndicator } from '../types/evidence.types';

export async function listStandards(activeOnly = true): Promise<Standard[]> {
  let query = supabase.from('standards').select('*').order('sort_order');
  if (activeOnly) query = query.eq('is_active', true);
  const { data, error } = await query;
  if (error) throw error;
  return data as Standard[];
}

export async function listIndicators(standardId: string): Promise<StandardIndicator[]> {
  const { data, error } = await supabase
    .from('standard_indicators')
    .select('*')
    .eq('standard_id', standardId)
    .eq('is_active', true)
    .order('sort_order');
  if (error) throw error;
  return data as StandardIndicator[];
}

export async function updateStandard(
  id: string,
  patch: Partial<Pick<Standard, 'name_ar' | 'description_ar' | 'weight' | 'sort_order' | 'is_active'>>,
): Promise<void> {
  const { error } = await supabase.from('standards').update(patch).eq('id', id);
  if (error) throw error;
}
