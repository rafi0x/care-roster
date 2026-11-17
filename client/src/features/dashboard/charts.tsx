'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from 'recharts';
import { useIsMobile } from '@/hooks/use-mobile';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { formatShortDate } from '@/lib/format';
import type { DashboardStats } from '@/lib/types';

const perDoctorConfig = { count: { label: 'Patients', color: 'var(--chart-2)' } } satisfies ChartConfig;
const timelineConfig = { patients: { label: 'New patients', color: 'var(--chart-1)' } } satisfies ChartConfig;

export function TimelineChart({ data }: { data: DashboardStats['timeline'] }) {
  return (
    <ChartContainer config={timelineConfig} className="aspect-auto h-[260px] w-full">
      <AreaChart accessibilityLayer data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="patients-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-patients)" stopOpacity={0.28} />
            <stop offset="100%" stopColor="var(--color-patients)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} axisLine={false} minTickGap={32} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={32} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(d) => formatShortDate(String(d))} />} />
        <Area type="monotone" dataKey="patients" stroke="var(--color-patients)" strokeWidth={2} fill="url(#patients-fill)" isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  );
}

export function PatientsPerDoctorChart({ data }: { data: DashboardStats['patientsPerDoctor'] }) {
  const mobile = useIsMobile(); // narrower name axis leaves room for the bars on phones
  return (
    <ChartContainer config={perDoctorConfig} className="aspect-auto w-full" style={{ height: Math.max(data.length * 36, 120) }}>
      <BarChart accessibilityLayer data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }} barCategoryGap={8}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={mobile ? 104 : 150} tick={{ fontSize: mobile ? 11 : 12 }} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={[0, 5, 5, 0]} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" className="fill-foreground font-medium" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
