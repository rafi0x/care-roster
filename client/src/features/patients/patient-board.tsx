'use client';

import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { CONDITIONS } from '@/lib/conditions';
import { formatNumber } from '@/lib/format';
import { usePatients } from '@/lib/queries';
import type { Condition } from '@/lib/types';

const PREVIEW = 6;

function Lane({ doctorId, condition, label, color }: { doctorId: string; condition: Condition; label: string; color: string }) {
  const { data, isPending } = usePatients({ condition, limit: PREVIEW }, doctorId);
  const total = data?.meta.total ?? 0;

  return (
    <section aria-label={label} className="flex min-w-0 flex-col rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-2 border-b px-3 py-2.5" style={{ boxShadow: `inset 0 3px 0 ${color}` }}>
        <h3 className="flex items-center gap-2 pt-1 text-sm font-medium">{label}</h3>
        <span className="pt-1 font-heading text-lg font-semibold tabular-nums">{isPending ? '–' : formatNumber(total)}</span>
      </header>
      <ul className="flex flex-1 flex-col gap-2 p-2">
        {isPending && Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        {data?.data.map((p) => (
          <li key={p.id}>
            <div className="rounded-lg border bg-background px-3 py-2">
              <span className="block truncate text-sm font-medium">{p.name}</span>
              <span className="block text-xs text-muted-foreground">
                {p.age} yrs · {p.gender}
              </span>
            </div>
          </li>
        ))}
        {data && total === 0 && <li className="px-1 py-6 text-center text-xs text-muted-foreground">No patients</li>}
      </ul>
      {total > PREVIEW && (
        <footer className="border-t px-3 py-2 text-sm">
          <Link href={`?view=table&condition=${condition}` as never} className="font-medium text-primary underline decoration-primary/40 underline-offset-4 hover:decoration-primary">
            View all {formatNumber(total)}
          </Link>
        </footer>
      )}
    </section>
  );
}

/** The doctor's patients as triage lanes, one column per condition, most urgent first. */
export function PatientBoard({ doctorId }: { doctorId: string }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
      {CONDITIONS.map((c) => (
        <Lane key={c.value} doctorId={doctorId} condition={c.value} label={c.label} color={c.color} />
      ))}
    </div>
  );
}
