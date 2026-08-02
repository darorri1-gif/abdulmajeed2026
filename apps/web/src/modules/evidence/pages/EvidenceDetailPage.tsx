import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, Pencil, Send, Trash2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCan } from '@/shared/hooks/usePermission';
import { Card, CardContent, CardHeader } from '@/shared/ui/Card';
import { Button } from '@/shared/ui/Button';
import { Alert, Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { StatusBadge } from '../components/StatusBadge';
import { EvidenceEditorDialog } from '../components/EvidenceEditorDialog';
import { EvidenceFiles } from '../components/EvidenceFiles';
import { EvidenceComments } from '../components/EvidenceComments';
import { EvidenceTimeline } from '../components/EvidenceTimeline';
import { ReviewPanel } from '../components/ReviewPanel';
import { useDeleteEvidence, useEvidence, useSubmitEvidence } from '../evidence.hooks';

export function EvidenceDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const myId = useAuthStore((s) => s.profile?.id);
  const canReview = useCan('evidence.review');

  const { data: evidence, isLoading, isError } = useEvidence(id);
  const submit = useSubmitEvidence(id);
  const remove = useDeleteEvidence();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }
  if (isError || !evidence) return <Alert>تعذّر تحميل الشاهد.</Alert>;

  const isOwner = evidence.teacher_id === myId;
  const editable = isOwner && (evidence.status === 'draft' || evidence.status === 'needs_revision');
  const showReview = canReview && !isOwner && evidence.status === 'submitted';

  return (
    <div className="space-y-5">
      <Link to="/evidence" className="inline-flex items-center gap-1 text-sm text-body hover:text-heading">
        <ArrowRight className="h-4 w-4" />
        عودة للشواهد
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-heading">{evidence.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {evidence.standard?.name_ar}
            {!isOwner && evidence.teacher?.full_name ? ` · ${evidence.teacher.full_name}` : ''}
          </p>
        </div>
        <StatusBadge status={evidence.status} />
      </div>

      {evidence.review_note && (evidence.status === 'needs_revision' || evidence.status === 'rejected') && (
        <Alert>ملاحظة المراجع: {evidence.review_note}</Alert>
      )}

      {evidence.description && (
        <Card>
          <CardContent className="whitespace-pre-wrap py-5 text-sm text-body">{evidence.description}</CardContent>
        </Card>
      )}

      {editable && (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
            تعديل
          </Button>
          <Button
            onClick={() => submit.mutate(undefined, { onSuccess: () => toast.success('تم إرسال الشاهد للمراجعة.') })}
            loading={submit.isPending}
          >
            <Send className="h-4 w-4" />
            إرسال للمراجعة
          </Button>
          {evidence.status === 'draft' && (
            <Button
              variant="ghost"
              onClick={() =>
                remove.mutate(evidence.id, {
                  onSuccess: () => {
                    toast.success('تم حذف الشاهد.');
                    navigate('/evidence');
                  },
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              حذف
            </Button>
          )}
        </div>
      )}

      {showReview && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-semibold text-heading">مراجعة الشاهد</h2>
          </CardHeader>
          <CardContent>
            <ReviewPanel evidenceId={evidence.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">المرفقات</h2>
        </CardHeader>
        <CardContent>
          <EvidenceFiles evidenceId={evidence.id} canEdit={isOwner} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">الملاحظات</h2>
        </CardHeader>
        <CardContent>
          <EvidenceComments evidenceId={evidence.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-heading">سجل الاعتماد</h2>
        </CardHeader>
        <CardContent>
          <EvidenceTimeline evidenceId={evidence.id} />
        </CardContent>
      </Card>

      <EvidenceEditorDialog open={editOpen} onOpenChange={setEditOpen} evidence={evidence} />
    </div>
  );
}
