import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, ListChecks, MessageSquareText, Play, Trash2, Type, Vote } from 'lucide-react';
import { Card, CardContent } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Textarea } from '@/shared/ui/Textarea';
import { Switch } from '@/shared/ui/Switch';
import { Label } from '@/shared/ui/Label';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { ItemEditor } from '../components/ItemEditor';
import { useAddItem, useDeleteWorksheet, useUpdateItem, useUpdateWorksheet, useWorksheet } from '../worksheets.hooks';
import type { ItemType } from '../types/worksheet.types';

const ADD_BUTTONS: { type: ItemType; label: string; icon: typeof Type }[] = [
  { type: 'multiple_choice', label: 'اختيار من متعدد', icon: ListChecks },
  { type: 'poll', label: 'تصويت', icon: Vote },
  { type: 'short_answer', label: 'إجابة قصيرة', icon: MessageSquareText },
  { type: 'info', label: 'معلومة', icon: Type },
];

export function WorksheetEditPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, isLoading, isError } = useWorksheet(id);
  const updateWs = useUpdateWorksheet(id);
  const deleteWs = useDeleteWorksheet();
  const addItem = useAddItem(id);
  const updateItem = useUpdateItem(id);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (data?.worksheet) {
      setTitle(data.worksheet.title);
      setDescription(data.worksheet.description ?? '');
    }
  }, [data?.worksheet]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !data) return <Alert>تعذّر تحميل ورقة العمل.</Alert>;

  const { worksheet, items } = data;

  function move(index: number, dir: 'up' | 'down') {
    const target = dir === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    updateItem.mutate({ id: a.id, patch: { position: b.position } });
    updateItem.mutate({ id: b.id, patch: { position: a.position } });
  }

  return (
    <div className="space-y-5">
      <Link to="/worksheets" className="inline-flex items-center gap-1 text-sm text-body hover:text-heading">
        <ArrowRight className="h-4 w-4" />
        عودة لأوراق العمل
      </Link>

      <Card>
        <CardContent className="space-y-4 py-5">
          <div>
            <Label htmlFor="title">العنوان</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="desc">الوصف</Label>
            <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="sm"
              onClick={() => updateWs.mutate({ title, description: description || null }, { onSuccess: () => toast.success('تم الحفظ.') })}
              loading={updateWs.isPending}
            >
              حفظ
            </Button>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
              <Switch
                checked={worksheet.is_published}
                onCheckedChange={(v) => updateWs.mutate({ is_published: v }, { onSuccess: () => toast.success('تم التحديث.') })}
              />
              نشر في المكتبة المشتركة
            </label>
            <Link
              to={`/worksheets/${id}/present`}
              className="inline-flex h-9 items-center gap-1 rounded-lg border border-border px-3 text-sm text-heading hover:bg-background"
            >
              <Play className="h-4 w-4" />
              عرض
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteWs.mutate(id, { onSuccess: () => { toast.success('تم الحذف.'); navigate('/worksheets'); } })}
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {items.map((item, i) => (
          <ItemEditor
            key={item.id}
            item={item}
            worksheetId={id}
            onMove={(dir) => move(i, dir)}
            canMoveUp={i > 0}
            canMoveDown={i < items.length - 1}
          />
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-heading">إضافة عنصر</p>
        <div className="flex flex-wrap gap-2">
          {ADD_BUTTONS.map((b) => (
            <Button
              key={b.type}
              variant="secondary"
              size="sm"
              onClick={() => addItem.mutate({ type: b.type, position: items.length })}
            >
              <b.icon className="h-4 w-4" />
              {b.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
