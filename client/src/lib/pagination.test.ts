import { describe, expect, it } from 'vitest';
import { pageWindow } from './pagination';

describe('pageWindow', () => {
  it('lists every page when there are few', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it('collapses distant pages around the current one', () => {
    expect(pageWindow(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20]);
    expect(pageWindow(1, 20)).toEqual([1, 2, 3, '…', 20]);
    expect(pageWindow(20, 20)).toEqual([1, '…', 18, 19, 20]);
  });
});
