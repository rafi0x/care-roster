import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DataTable, type Column } from './data-table';

type Row = { id: string; name: string; age: number };
const columns: Column<Row>[] = [
  { header: 'Name', cell: (r) => r.name },
  { header: 'Age', cell: (r) => r.age },
];
const rows: Row[] = [
  { id: '1', name: 'Rina', age: 30 },
  { id: '2', name: 'Karim', age: 41 },
];

describe('DataTable', () => {
  it('renders a header and one row per record', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} card={(r) => r.name} empty="Nothing here" />);
    expect(screen.getAllByRole('columnheader').map((h) => h.textContent)).toEqual(['Name', 'Age']);
    const body = screen.getAllByRole('row').slice(1);
    expect(body).toHaveLength(2);
    expect(within(body[1]).getByText('Karim')).toBeInTheDocument();
  });

  it('also renders one card per record for phones', () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(r) => r.id} card={(r) => `card:${r.name}`} empty="Nothing here" />);
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['card:Rina', 'card:Karim']);
  });

  it('shows the empty message when there are no rows', () => {
    render(<DataTable columns={columns} rows={[]} rowKey={(r) => r.id} card={(r) => r.name} empty="No patients match these filters" />);
    expect(screen.getByText('No patients match these filters')).toBeInTheDocument();
  });

  it('shows placeholders while loading', () => {
    render(<DataTable columns={columns} rows={undefined} rowKey={(r) => r.id} card={(r) => r.name} empty="x" />);
    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByText('x')).not.toBeInTheDocument();
  });
});
