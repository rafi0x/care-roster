'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ErrorState, PageHeader, Panel } from '@/components/app/page';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useListParams } from '@/hooks/use-list-params';
import { CONDITIONS } from '@/lib/conditions';
import { formatNumber } from '@/lib/format';
import { useDashboard } from '@/lib/queries';
import type { DashboardStats } from '@/lib/types';

// Recharts is the heaviest dependency; load it only on this page, after the shell has painted.
const chartFallback = () => <Skeleton className="h-[260px] w-full" />;
const PatientsPerDoctorChart = dynamic(() => import('./charts').then((m) => m.PatientsPerDoctorChart), { ssr: false, loading: chartFallback });
const TimelineChart = dynamic(() => import('./charts').then((m) => m.TimelineChart), { ssr: false, loading: chartFallback });

const RANGES = [7, 30, 90];

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="p-4 sm:p-6">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-heading text-4xl font-semibold tabular-nums tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

/** The ward board: one strip, each condition sized by its share of patients. */
function WardBoard({ rows, total }: { rows: DashboardStats['patientsByCondition']; total: number }) {
  const counts = new Map(rows.map((r) => [r.condition, r.count]));
  const items = CONDITIONS.map((c) => ({ ...c, count: counts.get(c.value) ?? 0 }));
  const share = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  return (
    <>
      <div className="flex h-12 gap-0.5 overflow-hidden rounded-lg" role="img" aria-label={items.map((i) => `${i.label}: ${i.count}`).join(', ')}>
        {items.filter((i) => i.count > 0).map((i) => (
          <span key={i.value} style={{ flexGrow: i.count, background: i.color }} className="min-w-1 basis-0" />
        ))}
        {total === 0 && <span className="flex-1 bg-border" />}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((i) => (
          <li key={i.value}>
            <Link href={`/patients?condition=${i.value}`} className="group block">
              <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground">
                <span className="size-2 rounded-full" style={{ background: i.color }} aria-hidden />
                {i.label}
              </span>
              <span className="mt-0.5 block font-heading text-2xl font-semibold tabular-nums">
                {formatNumber(i.count)}
                <span className="ml-2 font-sans text-sm font-normal text-muted-foreground">{share(i.count)}%</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function BarList({ rows }: { rows: { label: string; count: number }[] }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="flex justify-between gap-4 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="font-medium tabular-nums">{r.count}</span>
          </div>
          <Progress value={(r.count / max) * 100} className="mt-1.5 h-1.5" />
        </li>
      ))}
    </ul>
  ); 
}

function Section({ title, note, children, className = '' }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          <h2>{title}</h2>
        </CardTitle>
        {note && <CardDescription>{note}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function Dashboard() {
  const { params, setParams } = useListParams();
  const days = RANGES.includes(Number(params.days)) ? Number(params.days) : 30;
  const { data, error, refetch, isPlaceholderData } = useDashboard(days);

  const header = (
    <PageHeader
      title="Dashboard"
      subtitle="Who is under care, and with whom."
      action={
        <ToggleGroup
          type="single"
          variant="outline"
          aria-label="Date range"
          value={String(days)}
          onValueChange={(v) => v && setParams({ days: v === '30' ? undefined : v })}
          className="bg-card"
        >
          {RANGES.map((d) => (
            <ToggleGroupItem key={d} value={String(d)} className="px-3 max-sm:flex-1 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
              {d} days
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      }
    />
  );

  if (error) {
    return (
      <>
        {header}
        <Panel>
          <ErrorState message={error.message} onRetry={refetch} />
        </Panel>
      </>
    );
  }
  if (!data) {
    return (
      <>
        {header}
        <div className="space-y-4" aria-busy>
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </>
    );
  }

  const { totals } = data;
  const perDoctor = totals.doctors ? (totals.patients / totals.doctors).toFixed(1) : '0';
  const criticalShare = totals.patients ? Math.round((totals.criticalPatients / totals.patients) * 100) : 0;

  return (
    <>
      {header}
      <div className={`space-y-4 transition-opacity ${isPlaceholderData ? 'opacity-60' : ''}`}>
        <Panel className="grid grid-cols-2 max-lg:[&>*:nth-child(-n+2)]:border-b max-lg:[&>*:nth-child(odd)]:border-r lg:grid-cols-4 lg:divide-x">
          <Stat label="Doctors" value={formatNumber(totals.doctors)} note={`${totals.newDoctors} added in ${days} days`} />
          <Stat label="Patients" value={formatNumber(totals.patients)} note={`${totals.newPatients} added in ${days} days`} />
          <Stat label="Critical now" value={formatNumber(totals.criticalPatients)} note={`${criticalShare}% of all patients`} />
          <Stat label="Patients per doctor" value={perDoctor} note="Average caseload" />
        </Panel>

        <Section title="Patients by condition" note="Select a condition to see those patients.">
          <WardBoard rows={data.patientsByCondition} total={totals.patients} />
        </Section>

        <Section title="New patients per day" note={`Last ${days} days`}>
          <TimelineChart data={data.timeline} />
        </Section>

        <div className="grid gap-4 lg:grid-cols-5">
          <Section title="Busiest doctors" note="Top 10 by number of patients" className="lg:col-span-3">
            {data.patientsPerDoctor.length ? (
              <PatientsPerDoctorChart data={data.patientsPerDoctor} />
            ) : (
              <p className="text-sm text-muted-foreground">No patients assigned yet.</p>
            )}
          </Section>
          <Section title="Doctors by specialization" className="lg:col-span-2">
            <BarList rows={data.doctorsBySpecialization.map((s) => ({ label: s.specialization, count: s.count }))} />
          </Section>
        </div>
      </div>
    </>
  );
}
