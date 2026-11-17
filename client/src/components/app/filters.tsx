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

// `min-h-8!` beats the touch-device 44px rule so every filter control matches the date button's height.
export function FilterSelect({ label, value, onChange, options }: SelectProps) {
  return (
    <Select value={value || ALL} onValueChange={(v) => onChange(v === ALL ? '' : v)}>
      <SelectTrigger aria-label={label} className="min-h-8! bg-card max-sm:order-1 max-sm:min-w-0 max-sm:flex-1 max-sm:basis-0">
        {/* Short text when unfiltered so three selects fit one phone row */}
        <SelectValue>{value ? options.find((o) => o.value === value)?.label : label}</SelectValue>
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
        <Button
          variant="outline"
          aria-label={`Date added: ${label}`}
          className={cn('relative min-h-8! bg-card font-normal max-sm:size-8 max-sm:min-w-8! max-sm:px-0', !start && 'text-muted-foreground')}
        >
          <CalendarIcon aria-hidden />
          <span className="max-sm:sr-only">{label}</span>
          {start && <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-primary sm:hidden" aria-hidden />}
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
  options: readonly { key: string; order: 'asc' | 'desc'; label: string; short: string }[];
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
      <SelectTrigger aria-label="Sort by" className="min-h-8! bg-card max-sm:order-1 max-sm:min-w-0 max-sm:flex-1 max-sm:basis-0 sm:hidden">
        <SelectValue>{options.find((o) => `${o.key}:${o.order}` === value)?.short}</SelectValue>
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
        <Button variant="ghost" onClick={onClear} className="max-sm:order-2">
          Clear filters
        </Button>
      )}
    </div>
  );
}
