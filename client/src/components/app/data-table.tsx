import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import type { Sort } from '@/hooks/use-list-params';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  align?: 'right';
  /** Hide the column label in the stacked mobile layout (titles, action buttons). */
  bare?: boolean;
  /** Makes the header a sort button for this server-side sort key. */
  sortKey?: string;
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
  sort?: Sort;
  onSort?: (key: string) => void;
  /** Phone layout: one card per row (the table is shown from `sm` up). */
  card: (row: T) => ReactNode;
}

/**
 * One shadcn Table for every list. Below `sm` the same markup reflows into stacked
 * records via CSS (see `.data-table` in globals.css) — no duplicate mobile DOM.
 */
export function DataTable<T>({ columns, rows, rowKey, empty, stale, rowAccent, onRowClick, sort, onSort, card }: Props<T>) {
  if (rows?.length === 0) {
    return <div className="px-4 py-16 text-center text-sm text-muted-foreground">{empty}</div>;
  }

  return (
    <>
      <ul className={cn('divide-y transition-opacity sm:hidden', stale && 'opacity-60')} aria-busy={!rows}>
        {rows
          ? rows.map((row) => (
              <li
                key={rowKey(row)}
                onClick={onRowClick && (() => onRowClick(row))}
                style={{ boxShadow: rowAccent ? `inset 3px 0 0 ${rowAccent(row)}` : undefined }}
                className={cn('px-4 py-4', onRowClick && 'cursor-pointer active:bg-muted/60')}
              >
                {card(row)}
              </li>
            ))
          : Array.from({ length: 4 }, (_, i) => (
              <li key={i} aria-hidden className="space-y-2 px-4 py-4">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </li>
            ))}
      </ul>
    <Table className={cn('data-table max-sm:hidden transition-opacity', stale && 'opacity-60')} aria-busy={!rows}>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          {columns.map((c) => (
            <TableHead
              key={c.header}
              scope="col"
              aria-sort={c.sortKey && sort?.key === c.sortKey ? (sort.order === 'asc' ? 'ascending' : 'descending') : undefined}
              className={cn('text-muted-foreground', c.align === 'right' && 'text-right')}
            >
              {c.sortKey && onSort ? (
                <Button variant="ghost" size="sm" onClick={() => onSort(c.sortKey!)} className={cn('-mx-2.5 font-medium', sort?.key === c.sortKey && 'text-foreground')}>
                  {c.header}
                  {sort?.key !== c.sortKey ? <ArrowUpDown aria-hidden /> : sort.order === 'asc' ? <ArrowUp aria-hidden /> : <ArrowDown aria-hidden />}
                </Button>
              ) : (
                c.header
              )}
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
    </>
  );
}
