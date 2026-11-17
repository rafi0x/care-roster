import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from './search-input';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('SearchInput', () => {
  it('reports only the settled value, not every keystroke', () => {
    const onSearch = vi.fn();
    render(<SearchInput value="" onSearch={onSearch} placeholder="Search doctors" />);
    const input = screen.getByRole('searchbox', { name: 'Search doctors' });

    fireEvent.change(input, { target: { value: 'c' } });
    fireEvent.change(input, { target: { value: 'ca' } });
    fireEvent.change(input, { target: { value: 'car' } });
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith('car');
  });

  it('follows an external reset', () => {
    const { rerender } = render(<SearchInput value="abc" onSearch={() => {}} placeholder="Search" />);
    rerender(<SearchInput value="" onSearch={() => {}} placeholder="Search" />);
    expect(screen.getByRole('searchbox')).toHaveValue('');
  });
});
