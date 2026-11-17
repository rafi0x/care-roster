'use client';

import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

interface Props {
  value: string;
  onSearch: (value: string) => void;
  placeholder: string;
  delay?: number;
}

/** Debounced search box: typing is instant locally, `onSearch` fires once the user pauses. */
export function SearchInput({ value, onSearch, placeholder, delay = 300 }: Props) {
  const [text, setText] = useState(value);

  // Follow external changes (back button, "Clear filters") without an effect.
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) return;
    const timer = setTimeout(() => onSearch(text), delay);
    return () => clearTimeout(timer);
  }, [text, value, onSearch, delay]);

  return (
    <div className="relative min-w-0 flex-1 basis-[calc(100%-5rem)] max-sm:-order-1 sm:basis-72">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input type="search" aria-label={placeholder} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} className="min-h-8! bg-card pl-8" />
    </div>
  );
}
