import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Badge } from '@/shared/ui/Badge';
import { useToast } from '@/shared/ui/toast';
import { useDeleteItem, useUpdateItem } from '../worksheets.hooks';
import type { WorksheetItem } from '../types/worksheet.types';

const TYPE_LABEL: Record<WorksheetItem['type'], string> = {
  multiple_choice: 'اختيار من متعدد',
  poll: 'تصويت',
  short_answer: 'إجابة قصيرة',
  info: 'معلومة',
};

export function ItemEditor({
  item,
  worksheetId,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  item: WorksheetItem;
  worksheetId: string;
  onMove: (dir: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const update = useUpdateItem(worksheetId);
  const del = useDeleteItem(worksheetId);
  const toast = useToast();

  const [prompt, setPrompt] = useState(item.prompt);
  const [options, setOptions] = useState<string[]>(item.options ?? []);
  const [correct, setCorrect] = useState<number>(typeof item.answer === 'number' ? item.answer : 0);
  const [model, setModel] = useState<string>(typeof item.answer === 'string' ? item.answer : '');

  const hasOptions = item.type === 'multiple_choice' || item.type === 'poll';

  function save() {
    const answer =
      item.type === 'multiple_choice' ? correct : item.type === 'short_answer' ? model : null;
    update.mutate(
      { id: item.id, patch: { prompt, options: hasOptions ? options : [], answer } },
      { onSuccess: () => toast.success('تم الحفظ.') },
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <Badge>{TYPE_LABEL[item.type]}</Badge>
        <div className="flex items-center gap-1">
          <button disabled={!canMoveUp} onClick={() => onMove('up')} className="p-1 text-muted hover:text-body disabled:opacity-30" aria-label="أعلى">
            <ChevronUp className="h-4 w-4" />
          </button>
          <button disabled={!canMoveDown} onClick={() => onMove('down')} className="p-1 text-muted hover:text-body disabled:opacity-30" aria-label="أسفل">
            <ChevronDown className="h-4 w-4" />
          </button>
          <button onClick={() => del.mutate(item.id)} className="p-1 text-muted hover:text-danger" aria-label="حذف">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="نص السؤال / المعلومة" className="min-h-16" />

      {hasOptions && (
        <div className="mt-3 space-y-2">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              {item.type === 'multiple_choice' && (
                <input type="radio" name={`correct-${item.id}`} checked={correct === i} onChange={() => setCorrect(i)} className="h-4 w-4 accent-brand-green" aria-label="الإجابة الصحيحة" />
              )}
              <Input value={opt} onChange={(e) => setOptions((prev) => prev.map((o, idx) => (idx === i ? e.target.value : o)))} />
              <button onClick={() => setOptions((prev) => prev.filter((_, idx) => idx !== i))} className="p-1 text-muted hover:text-danger" aria-label="حذف الخيار">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button variant="ghost" size="sm" onClick={() => setOptions((prev) => [...prev, `خيار ${prev.length + 1}`])}>
            <Plus className="h-4 w-4" />
            خيار
          </Button>
        </div>
      )}

      {item.type === 'short_answer' && (
        <div className="mt-3">
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="الإجابة النموذجية (تُعرض عند الكشف)" />
        </div>
      )}

      <div className="mt-3">
        <Button size="sm" onClick={save} loading={update.isPending}>
          <Save className="h-4 w-4" />
          حفظ
        </Button>
      </div>
    </div>
  );
}
