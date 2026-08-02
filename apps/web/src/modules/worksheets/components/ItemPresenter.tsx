import { Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { WorksheetItem } from '../types/worksheet.types';

export function ItemPresenter({ item, revealed }: { item: WorksheetItem; revealed: boolean }) {
  const correct = typeof item.answer === 'number' ? item.answer : -1;

  return (
    <div className="mx-auto w-full max-w-2xl text-center">
      <p className="mb-8 text-2xl font-bold leading-relaxed text-heading sm:text-3xl">{item.prompt}</p>

      {(item.type === 'multiple_choice' || item.type === 'poll') && (
        <div className="grid gap-3">
          {item.options.map((opt, i) => {
            const isCorrect = revealed && item.type === 'multiple_choice' && i === correct;
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center justify-between rounded-2xl border-2 p-4 text-lg transition-colors',
                  isCorrect ? 'border-brand-green bg-brand-green/10 text-brand-green' : 'border-border bg-surface text-heading',
                )}
              >
                <span>{opt}</span>
                {isCorrect && <Check className="h-5 w-5" />}
              </div>
            );
          })}
        </div>
      )}

      {item.type === 'short_answer' && revealed && typeof item.answer === 'string' && (
        <div className="rounded-2xl border-2 border-brand-green bg-brand-green/10 p-4 text-lg text-brand-green">
          {item.answer}
        </div>
      )}

      {item.type === 'short_answer' && !revealed && <p className="text-muted">اكتب إجابتك ثم اكشف النموذج.</p>}
    </div>
  );
}
