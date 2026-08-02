import { cn } from '@/shared/lib/utils';
import type { Standard } from '../types/evidence.types';

interface Props {
  standards: Standard[];
  counts: Record<string, number>;
  total: number;
  activeStandardId: string | null;
  onSelect: (standardId: string | null) => void;
}

export function StandardsBoard({ standards, counts, total, activeStandardId, onSelect }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      <button
        onClick={() => onSelect(null)}
        className={cn(
          'rounded-2xl border p-4 text-start transition-colors',
          activeStandardId === null ? 'border-brand-green bg-brand-green/5' : 'border-border bg-surface hover:bg-background',
        )}
      >
        <div className="text-2xl font-bold tabular-nums text-heading">{total}</div>
        <div className="mt-1 text-xs text-body">كل المعايير</div>
      </button>

      {standards.map((s) => {
        const active = activeStandardId === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              'rounded-2xl border p-4 text-start transition-colors',
              active ? 'border-brand-green bg-brand-green/5' : 'border-border bg-surface hover:bg-background',
            )}
          >
            <div className="text-2xl font-bold tabular-nums text-heading">{counts[s.id] ?? 0}</div>
            <div className="mt-1 line-clamp-2 text-xs text-body">{s.name_ar}</div>
          </button>
        );
      })}
    </div>
  );
}
