/** Page numbers to show: first, last and the current page's neighbours, with gaps collapsed. */
export function pageWindow(page: number, totalPages: number): Array<number | '…'> {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  if (page <= 2) wanted.add(3);
  if (page >= totalPages - 1) wanted.add(totalPages - 2);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);

  const out: Array<number | '…'> = [];
  pages.forEach((p, i) => {
    const gap = i > 0 ? p - pages[i - 1] : 1;
    if (gap === 2) out.push(p - 1); // a one-page gap is shorter shown than hidden
    else if (gap > 2) out.push('…');
    out.push(p);
  });
  return out;
}
