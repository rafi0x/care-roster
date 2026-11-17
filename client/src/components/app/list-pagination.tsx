import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { pageWindow } from '@/lib/pagination';
import type { PageMeta } from '@/lib/types';

interface Props {
  meta: PageMeta;
  onPageChange: (page: number) => void;
}

/**
 * shadcn Pagination layout with Buttons instead of its anchor links:
 * the page lives in URL state changed by a callback, so these are actions, not navigations.
 */
export function ListPagination({ meta, onPageChange }: Props) {
  const { page, limit, total, totalPages } = meta;
  if (total === 0) return null;
  const first = (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3">
      <p className="text-sm tabular-nums text-muted-foreground">{`${first}–${last} of ${total}`}</p>
      <Pagination className="mx-0 w-auto">
        <PaginationContent>
          <PaginationItem>
            <Button variant="ghost" size="icon" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
              <ChevronLeft />
            </Button>
          </PaginationItem>
          {pageWindow(page, totalPages).map((p, i) =>
            p === '…' ? (
              <PaginationItem key={`gap-${i}`} className="max-sm:hidden">
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p} className={p === page ? undefined : 'max-sm:hidden'}>
                <Button
                  variant={p === page ? 'default' : 'ghost'}
                  size="icon"
                  aria-label={`Page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                  onClick={() => onPageChange(p)}
                  className="tabular-nums"
                >
                  {p}
                </Button>
              </PaginationItem>
            ),
          )}
          <PaginationItem>
            <Button variant="ghost" size="icon" aria-label="Next page" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
              <ChevronRight />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
