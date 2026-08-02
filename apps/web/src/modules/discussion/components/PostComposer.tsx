import { useState } from 'react';
import { Dialog, DialogContent } from '@/shared/ui/Dialog';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { Label } from '@/shared/ui/Label';
import { Select } from '@/shared/ui/Select';
import { Textarea } from '@/shared/ui/Textarea';
import { useCan } from '@/shared/hooks/usePermission';
import { useToast } from '@/shared/ui/toast';
import { useCategories, useCreatePost } from '../discussion.hooks';

export function PostComposer({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (id: string) => void;
}) {
  const { data: categories } = useCategories();
  const canModerate = useCan('discussion.moderate');
  const create = useCreatePost();
  const toast = useToast();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [announcement, setAnnouncement] = useState(false);

  function submit() {
    if (title.trim().length < 3) {
      toast.error('أدخل عنوانًا واضحًا.');
      return;
    }
    create.mutate(
      { title: title.trim(), body: body.trim() || undefined, category_id: categoryId || null, is_announcement: announcement },
      {
        onSuccess: (res) => {
          toast.success('تم النشر.');
          setTitle('');
          setBody('');
          setCategoryId('');
          setAnnouncement(false);
          onOpenChange(false);
          onCreated?.(res.id);
        },
        onError: (e) => toast.error((e as Error).message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="موضوع جديد" className="max-w-xl">
        <div className="space-y-4">
          <div>
            <Label htmlFor="title">العنوان</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="body">المحتوى</Label>
            <Textarea id="body" className="min-h-32" value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="cat">التصنيف</Label>
            <Select id="cat" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">بدون تصنيف</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_ar}
                </option>
              ))}
            </Select>
          </div>
          {canModerate && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
              <input type="checkbox" className="h-4 w-4 accent-brand-green" checked={announcement} onChange={(e) => setAnnouncement(e.target.checked)} />
              نشر كإعلان
            </label>
          )}
          <div className="flex justify-start gap-2 pt-2">
            <Button onClick={submit} loading={create.isPending}>
              نشر
            </Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
