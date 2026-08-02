import { useRef } from 'react';
import { Download, FileText, Trash2, Upload } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Spinner } from '@/shared/ui/feedback';
import { useToast } from '@/shared/ui/toast';
import { getFileUrl } from '../data/evidence.api';
import { useDeleteFile, useEvidenceFiles, useUploadFile } from '../evidence.hooks';
import type { EvidenceFile } from '../types/evidence.types';

function formatSize(bytes: number | null) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export function EvidenceFiles({ evidenceId, canEdit }: { evidenceId: string; canEdit: boolean }) {
  const { data: files, isLoading } = useEvidenceFiles(evidenceId);
  const upload = useUploadFile(evidenceId);
  const remove = useDeleteFile(evidenceId);
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      upload.mutate(file, {
        onSuccess: () => toast.success('تم رفع الملف.'),
        onError: (err) => toast.error((err as Error).message),
      });
    }
    e.target.value = '';
  }

  async function open(file: EvidenceFile) {
    try {
      const url = await getFileUrl(file.storage_path);
      window.open(url, '_blank', 'noopener');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  return (
    <div className="space-y-3">
      {canEdit && (
        <div>
          <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
          <Button variant="secondary" size="sm" onClick={() => inputRef.current?.click()} loading={upload.isPending}>
            <Upload className="h-4 w-4" />
            رفع ملف
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner />
        </div>
      ) : !files?.length ? (
        <p className="text-sm text-muted">لا توجد مرفقات بعد.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 p-3">
              <FileText className="h-5 w-5 shrink-0 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-heading">{f.original_name}</p>
                <p className="text-xs text-muted">{formatSize(f.file_size)}</p>
              </div>
              <button onClick={() => open(f)} className="p-1.5 text-body hover:text-brand-green" aria-label="فتح">
                <Download className="h-4 w-4" />
              </button>
              {canEdit && (
                <button
                  onClick={() => remove.mutate(f, { onSuccess: () => toast.success('تم حذف الملف.') })}
                  className="p-1.5 text-body hover:text-danger"
                  aria-label="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
