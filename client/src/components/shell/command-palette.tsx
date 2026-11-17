'use client';

import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, LayoutDashboard, LogOut, Stethoscope, UserX, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { api } from '@/lib/api';
import type { Doctor, Paginated, Patient } from '@/lib/types';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOut: () => void;
}

/** Debounced value, so typing does not fire a request per keystroke. */
function useDebounced(value: string, delay = 200) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function Item({ icon: Icon, onSelect, children, value }: { icon: ComponentType<{ className?: string }>; onSelect: () => void; children: ReactNode; value?: string }) {
  return (
    <CommandItem value={value} onSelect={onSelect}>
      <Icon className="size-4" />
      {children}
    </CommandItem>
  );
}

/** Cmd/Ctrl+K: jump to a page, a saved view, a doctor or a patient without touching the sidebar. */
export function CommandPalette({ open, onOpenChange, onSignOut }: Props) {
  const router = useRouter();
  const [text, setText] = useState('');
  const term = useDebounced(text.trim());

  // Fresh palette every time it opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setText('');
  }

  const search = useQuery({
    queryKey: ['palette', term],
    enabled: open && term.length >= 2,
    queryFn: async ({ signal }) => {
      const q = `?search=${encodeURIComponent(term)}&limit=5`;
      const [doctors, patients] = await Promise.all([
        api<Paginated<Doctor>>(`/doctors${q}`, { signal }),
        api<Paginated<Patient>>(`/patients${q}`, { signal }),
      ]);
      return { doctors: doctors.data, patients: patients.data };
    },
    staleTime: 30_000,
  });

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href as never);
  };
  const run = (fn: () => void) => {
    onOpenChange(false);
    fn();
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="sm:max-w-xl" title="Search" description="Search doctors and patients, or jump to a page">
      <Command>
      <CommandInput placeholder="Search doctors, patients or jump to…" value={text} onValueChange={setText} />
      <CommandList>
        <CommandEmpty>{term.length >= 2 && search.isFetching ? 'Searching…' : 'No results.'}</CommandEmpty>

        {search.data && search.data.doctors.length > 0 && (
          <CommandGroup heading="Doctors">
            {search.data.doctors.map((d) => (
              <Item key={d.id} value={`doctor ${d.name} ${d.id}`} icon={Stethoscope} onSelect={() => go(`/doctors/${d.id}`)}>
                <span className="flex-1">{d.name}</span>
                <span className="text-xs text-muted-foreground">{d.specialization}</span>
              </Item>
            ))}
          </CommandGroup>
        )}
        {search.data && search.data.patients.length > 0 && (
          <CommandGroup heading="Patients">
            {search.data.patients.map((p) => (
              <Item key={p.id} value={`patient ${p.name} ${p.id}`} icon={Users} onSelect={() => go(`/patients?search=${encodeURIComponent(p.name)}`)}>
                <span className="flex-1">{p.name}</span>
                <span className="text-xs text-muted-foreground">{p.doctor?.name ?? 'Unassigned'}</span>
              </Item>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />
        <CommandGroup heading="Go to">
          <Item icon={LayoutDashboard} onSelect={() => go('/')}>Dashboard</Item>
          <Item icon={Stethoscope} onSelect={() => go('/doctors')}>Doctors</Item>
          <Item icon={Users} onSelect={() => go('/patients')}>Patients</Item>
        </CommandGroup>
        <CommandGroup heading="Views">
          <Item icon={AlertTriangle} onSelect={() => go('/patients?condition=critical')}>Critical patients</Item>
          <Item icon={UserX} onSelect={() => go('/patients?doctor=unassigned')}>Unassigned patients</Item>
        </CommandGroup>
        <CommandGroup heading="Account">
          <Item icon={LogOut} onSelect={() => run(onSignOut)}>Sign out</Item>
        </CommandGroup>
      </CommandList>
      </Command>
    </CommandDialog>
  );
}
