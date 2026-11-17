import { describe, expect, it } from 'vitest';
import { csvField, toCsv } from './csv';

describe('csv', () => {
  it('quotes commas, quotes and newlines', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField('line\nbreak')).toBe('"line\nbreak"');
  });

  it('neutralises spreadsheet formulas', () => {
    expect(csvField('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(csvField('@cmd')).toBe("'@cmd");
  });

  it('renders empty values and a header row after a BOM', () => {
    expect(toCsv(['a', 'b'], [[1, null]])).toBe('﻿a,b\r\n1,');
  });
});
