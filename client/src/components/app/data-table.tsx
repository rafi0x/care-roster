import type { CSSProperties, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'right';
  /** Hide the column label in the stacked mobile layout (titles, action buttons). */
  bare?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  /** `undefined` means the first page is still loading. */
  rows: T[] | undefined;
  rowKey: (row: T) => string;
  empty: ReactNode;
  /** Dim while a new page is fetched and the previous one is still on screen. */
  stale?: boolean;
  /** Colour of the "wristband" stripe on the row's leading edge. */
  rowAccent?: (row: T) => string;
  /** Makes the whole row a click target (keep a real link inside for keyboard and screen readers). */
  onRowClick?: (row: T) => void;
}

/**
 * One shadcn Table for every list. Below `sm` the same markup reflows into stacked
 * records via CSS (see `.data-table` in globals.css) — no duplicate mobile DOM.
 */
export function DataTable<T>({ columns, rows, rowKey, empty, stale, rowAccent, onRowClick }: Props<T>) {
  if (rows?.length === 0) {
    return <div className="px-4 py-16 text-center text-sm text-muted-foreground">{empty}</div>;
  }

  return (
    <Table className={cn('data-table transition-opacity', stale && 'opacity-60')} aria-busy={!rows}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead key={c.header} scope="col" className={cn('text-muted-foreground', c.align === 'right' && 'text-right')}>
              {c.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows
          ? rows.map((row) => (
              <TableRow
                key={rowKey(row)}
                style={rowAccent && ({ '--accent-stripe': rowAccent(row) } as CSSProperties)}
                onClick={onRowClick && (() => onRowClick(row))}
                className={cn(onRowClick && 'cursor-pointer hover:bg-muted/60')}
              >
                {columns.map((c) => (
                  <TableCell key={c.header} data-label={c.bare ? undefined : c.header} className={cn(c.align === 'right' && 'sm:text-right')}>
                    {c.cell(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          : Array.from({ length: 6 }, (_, i) => (
              <TableRow key={i} aria-hidden>
                {columns.map((c) => (
                  <TableCell key={c.header}>
                    <Skeleton className="h-4 w-3/4" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
      </TableBody>
    </Table>
  );
}
