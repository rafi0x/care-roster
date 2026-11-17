'use client';

import { ChevronsUpDown, LayoutDashboard, LogOut, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { api } from '@/lib/api';
import { useMe } from '@/lib/queries';

const NAV = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctors', label: 'Doctors', icon: Stethoscope },
  { href: '/patients', label: 'Patients', icon: Users },
];

async function signOut() {
  await api('/auth/logout', { method: 'POST' }).catch(() => {});
  // Deliberate full reload: drops every cached query together with the session.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.assign('/login');
}

function UserMenu() {
  const { data: me } = useMe();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
          <Avatar className="size-8">
            <AvatarFallback>{me?.name?.[0] ?? '·'}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">{me?.name ?? ' '}</span>
            <span className="truncate text-xs capitalize text-muted-foreground">{me?.role ?? ' '}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" aria-hidden />
        </SidebarMenuButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel className="font-normal text-muted-foreground">{me?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavMenu() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  return (
    <SidebarMenu>
      {NAV.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton asChild isActive={isActive(href)}>
            <Link href={href} onClick={() => setOpenMobile(false)} aria-current={isActive(href) ? 'page' : undefined}>
              <Icon aria-hidden />
              {label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

/** shadcn Sidebar: fixed on desktop, an off-canvas sheet behind a menu button on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground" aria-hidden>
              <Stethoscope className="size-4" />
            </span>
            Doctor Tracker
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <NavMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <UserMenu />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <SidebarTrigger aria-label="Open menu" />
          <Separator orientation="vertical" className="h-5" />
          <span className="font-semibold">Doctor Tracker</span>
          {me?.role === 'staff' && <Badge variant="secondary" className="ml-auto">View only</Badge>}
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 md:py-10 lg:px-10">
          {me?.role === 'staff' && <Badge variant="secondary" className="mb-4 max-md:hidden">View-only account</Badge>}
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
