import { describe, expect, it } from 'vitest';
import { toQueryString } from './query-string';

describe('toQueryString', () => {
  it('drops empty values and encodes the rest', () => {
    expect(toQueryString({ search: 'a b', page: 2, condition: '', from: undefined, to: null })).toBe('?search=a+b&page=2');
  });
  it('returns an empty string when nothing is set', () => {
    expect(toQueryString({ search: '' })).toBe('');
  });
});
