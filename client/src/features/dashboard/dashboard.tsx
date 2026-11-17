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
const TimelineChart = dynamic(() => import('./charts').then((m) => m.TimelineChart), { ssr: false, loading: chartFallback });

const RANGES = [7, 30, 90];

function Stat({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-3xl font-semibold tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">{note}</CardContent>
    </Card>
  );
}

/** One row per condition: label, count and share, each linking to the filtered patient list. */
function Conditions({ rows, total }: { rows: DashboardStats['patientsByCondition']; total: number }) {
  const counts = new Map(rows.map((r) => [r.condition, r.count]));
  return (
    <ul className="space-y-4">
      {CONDITIONS.map((c) => {
        const count = counts.get(c.value) ?? 0;
        const share = total ? Math.round((count / total) * 100) : 0;
        return (
          <li key={c.value}>
            <Link href={`/patients?condition=${c.value}`} className="group block">
              <span className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 group-hover:underline">
                  <span className="size-2 rounded-full" style={{ background: c.color }} aria-hidden />
                  {c.label}
                </span>
                <span className="tabular-nums text-muted-foreground">
                  <span className="font-medium text-foreground">{formatNumber(count)}</span> · {share}%
                </span>
              </span>
              <Progress value={share} className="mt-2 h-1.5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Section({ title, note, children, className = '' }: { title: string; note?: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>
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
      subtitle="An overview of doctors and patients."
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
            <ToggleGroupItem key={d} value={String(d)} className="px-3">
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
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat label="Doctors" value={formatNumber(totals.doctors)} note={`${totals.newDoctors} new in ${days} days`} />
          <Stat label="Patients" value={formatNumber(totals.patients)} note={`${totals.newPatients} new in ${days} days`} />
          <Stat label="Critical now" value={formatNumber(totals.criticalPatients)} note={`${criticalShare}% of patients`} />
          <Stat label="Patients per doctor" value={perDoctor} note="Average caseload" />
        </div>

        <div className="grid gap-4 lg:grid-cols-5">
          <Section title="New patients" note={`Per day, last ${days} days`} className="lg:col-span-3">
            <TimelineChart data={data.timeline} />
          </Section>
          <Section title="By condition" note="Select one to see those patients." className="lg:col-span-2">
            <Conditions rows={data.patientsByCondition} total={totals.patients} />
          </Section>
        </div>
      </div>
    </>
  );
}
