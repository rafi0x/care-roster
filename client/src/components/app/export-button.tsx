'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { downloadCsv, toCsv } from '@/lib/csv';
import { toQueryString, type QueryParams } from '@/lib/query-string';
import type { Paginated } from '@/lib/types';

const PAGE = 100; // the API's maximum page size
const MAX_ROWS = 2000;

interface Props<T> {
  /** API list path, e.g. `/patients`. */
  path: string;
  /** The list's current filters and sort (page is ignored: the export is every matching row). */
  params: QueryParams;
  filename: string;
  header: string[];
  row: (item: T) => unknown[];
}

/** Downloads every row matching the current search and filters as CSV (up to 2,000). */
export function ExportButton<T>({ path, params, filename, header, row }: Props<T>) {
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const rows: T[] = [];
      let page = 1;
      let totalPages = 1;
      do {
        const res = await api<Paginated<T>>(`${path}${toQueryString({ ...params, page, limit: PAGE })}`);
        rows.push(...res.data);
        totalPages = res.meta.totalPages;
        page += 1;
      } while (page <= totalPages && rows.length < MAX_ROWS);
      downloadCsv(filename, toCsv(header, rows.slice(0, MAX_ROWS).map(row)));
      toast.success(`Exported ${Math.min(rows.length, MAX_ROWS)} rows`);
    } catch {
      toast.error('Could not export. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="outline" onClick={run} disabled={busy} aria-label="Export CSV" className="min-h-8! bg-card max-sm:size-8 max-sm:px-0">
      <Download aria-hidden />
      <span className="max-sm:sr-only">{busy ? 'Exporting…' : 'Export'}</span>
    </Button>
  );
}
