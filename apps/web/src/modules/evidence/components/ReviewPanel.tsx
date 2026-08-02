import { useState } from 'react';
import { Button } from '@/shared/ui/Button';
import { Textarea } from '@/shared/ui/Textarea';
import { Label } from '@/shared/ui/Label';
import { useToast } from '@/shared/ui/toast';
import { useCan } from '@/shared/hooks/usePermission';
import { useReviewEvidence } from '../evidence.hooks';

export function ReviewPanel({ evidenceId }: { evidenceId: string }) {
  const canApprove = useCan('evidence.approve');
  const review = useReviewEvidence(evidenceId);
  const toast = useToast();
  const [note, setNote] = useState('');

  function act(action: 'approve' | 'reject' | 'needs_revision', successMsg: string) {
    review.mutate(
      { action, note: note.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(successMsg);
          setNote('');
        },
        onError: (err) => toast.error((err as Error).message),
      },
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="review_note">ملاحظة المراجعة (اختياري)</Label>
        <Textarea id="review_note" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-2">
        {canApprove && (
          <Button onClick={() => act('approve', 'تم اعتماد الشاهد.')} loading={review.isPending}>
            اعتماد
          </Button>
        )}
        <Button variant="secondary" onClick={() => act('needs_revision', 'تم طلب التعديل.')} loading={review.isPending}>
          طلب تعديل
        </Button>
        <Button variant="destructive" onClick={() => act('reject', 'تم رفض الشاهد.')} loading={review.isPending}>
          رفض
        </Button>
      </div>
    </div>
  );
}
