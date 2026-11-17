'use client';

import { format, parse } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Radix Select items cannot have an empty value, so "no filter" gets a sentinel.
const ALL = '__all__';

interface SelectProps {
  label: string;
  value: string | undefined;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

export function FilterSelect({ label, value, onChange, options }: SelectProps) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger aria-label={label} className="bg-card max-sm:flex-1">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{label}: all</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

interface DateRangeProps {
  from: string | undefined;
  to: string | undefined;
  onChange: (patch: { from?: string; to?: string }) => void;
}

// Local-date helpers: toISOString() would shift a picked day backwards in timezones ahead of UTC.
const toParam = (d: Date) => format(d, 'yyyy-MM-dd');
const fromParam = (v?: string) => (v ? parse(v, 'yyyy-MM-dd', new Date()) : undefined);

/** One shadcn Popover + range Calendar instead of two native date inputs. */
export function DateRange({ from, to, onChange }: DateRangeProps) {
  const start = fromParam(from);
  const end = fromParam(to);
  const label = start ? `${format(start, 'd MMM')}${end ? ` – ${format(end, 'd MMM')}` : ''}` : 'Date added';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('bg-card font-normal max-sm:flex-1', !start && 'text-muted-foreground')}>
          <CalendarIcon aria-hidden />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="range"
          numberOfMonths={1}
          selected={start ? { from: start, to: end } : undefined}
          onSelect={(r) => onChange({ from: r?.from ? toParam(r.from) : undefined, to: r?.to ? toParam(r.to) : undefined })}
          disabled={{ after: new Date() }}
        />
      </PopoverContent>
    </Popover>
  );
}

interface SortSelectProps {
  value: string;
  onChange: (key: string, order: 'asc' | 'desc') => void;
  options: readonly { key: string; order: 'asc' | 'desc'; label: string }[];
}

/** Sort control for phones, where the table header (and its sort buttons) is hidden. */
export function SortSelect({ value, onChange, options }: SortSelectProps) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        const o = options.find((x) => `${x.key}:${x.order}` === v)!;
        onChange(o.key, o.order);
      }}
    >
      <SelectTrigger aria-label="Sort by" className="bg-card max-sm:flex-1 sm:hidden">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={`${o.key}:${o.order}`} value={`${o.key}:${o.order}`}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FilterBar({ children, onClear }: { children: ReactNode; onClear?: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b p-3 sm:p-4">
      {children}
      {onClear && (
        <Button variant="ghost" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}
