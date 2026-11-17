import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListPagination as Pagination } from './list-pagination';

const meta = { page: 2, limit: 10, total: 45, totalPages: 5 };

describe('Pagination', () => {
  it('describes the visible range', () => {
    render(<Pagination meta={meta} onPageChange={() => {}} />);
    expect(screen.getByText('11–20 of 45')).toBeInTheDocument();
  });

  it('moves between pages and marks the current one', async () => {
    const onPageChange = vi.fn();
    render(<Pagination meta={meta} onPageChange={onPageChange} />);
    expect(screen.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');

    await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Previous page' }));
    await userEvent.click(screen.getByRole('button', { name: 'Page 5' }));
    expect(onPageChange.mock.calls).toEqual([[3], [1], [5]]);
  });

  it('disables the edges', () => {
    const { rerender } = render(<Pagination meta={{ ...meta, page: 1 }} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    rerender(<Pagination meta={{ ...meta, page: 5 }} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('renders nothing for an empty list', () => {
    const { container } = render(<Pagination meta={{ page: 1, limit: 10, total: 0, totalPages: 0 }} onPageChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });
});
