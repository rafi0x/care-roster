'use client';

import { ChevronsUpDown, LayoutDashboard, LogOut, Search, Stethoscope, Users } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@/components/ui/sidebar';
import { api } from '@/lib/api';
import { useMe } from '@/lib/queries';
import { CommandPalette } from './command-palette';

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
        <SidebarMenuButton size="lg" className="gap-3 text-white hover:bg-white/5 hover:text-white data-[state=open]:bg-white/10 data-[state=open]:text-white">
          <Avatar className="size-9">
            <AvatarFallback className="bg-white/15 text-white">{me?.name?.[0] ?? '·'}</AvatarFallback>
          </Avatar>
          <div className="grid min-w-0 flex-1 text-left leading-tight">
            <span className="truncate text-sm font-medium">{me?.name ?? ' '}</span>
            <span className="truncate text-xs capitalize text-sidebar-foreground/70">{me?.role ?? ' '}</span>
          </div>
          <ChevronsUpDown className="ml-auto size-4 text-sidebar-foreground/70" aria-hidden />
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
  const isActive = (href: string) => isActivePath(pathname, href);
  return (
    <SidebarMenu className="gap-1">
      {NAV.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            asChild
            size="lg"
            isActive={isActive(href)}
            className="relative gap-3 px-3 text-[15px] text-sidebar-foreground/80 hover:bg-white/5 hover:text-white data-[active=true]:bg-white/10 data-[active=true]:font-medium data-[active=true]:text-white data-[active=true]:before:absolute data-[active=true]:before:inset-y-2 data-[active=true]:before:left-0 data-[active=true]:before:w-1 data-[active=true]:before:rounded-r-full data-[active=true]:before:bg-sidebar-ring [&>svg]:size-5"
          >
            <Link href={href} aria-current={isActive(href) ? 'page' : undefined}>
              <Icon aria-hidden />
              {label}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}

const isActivePath = (pathname: string, href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));

/** Phones: avatar button in the top bar that opens the account menu (sign out). */
function MobileAccountMenu() {
  const { data: me } = useMe();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Account menu" className="rounded-full">
          <Avatar className="size-8">
            <AvatarFallback>{me?.name?.[0] ?? '·'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block font-medium text-foreground">{me?.name}</span>
          <span className="block capitalize text-muted-foreground">{me?.role}</span>
          <span className="block break-all text-muted-foreground">{me?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut aria-hidden />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Phones: thumb-reach tab bar for the three top-level screens. */
function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-3 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors aria-[current=page]:text-primary"
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** shadcn Sidebar on desktop; top bar, account menu and bottom tabs on phones. */
export function AppShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <SidebarProvider>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} onSignOut={signOut} />
      <Sidebar>
        <SidebarHeader className="px-5 pb-2 pt-6">
          <Link href="/" className="flex items-center gap-3 font-heading text-lg font-semibold text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-white/10" aria-hidden>
              <Stethoscope className="size-5" />
            </span>
            CareRoster
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3 pt-4">
            <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wider text-sidebar-foreground/50">Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="mb-3">
                <SidebarMenuItem>
                  <SidebarMenuButton size="lg" onClick={() => setPaletteOpen(true)} className="gap-3 px-3 text-[15px] text-sidebar-foreground/70 hover:bg-white/5 hover:text-white [&>svg]:size-5">
                    <Search aria-hidden />
                    Search
                    <kbd className="ml-auto rounded border border-white/15 px-1.5 py-0.5 text-[11px] font-sans text-sidebar-foreground/60">Ctrl K</kbd>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <NavMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
          <UserMenu />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b bg-background/90 px-4 backdrop-blur md:hidden">
          <Link href="/" className="flex items-center gap-2 font-heading font-semibold">
            <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground" aria-hidden>
              <Stethoscope className="size-4" />
            </span>
            CareRoster
          </Link>
          <div className="flex items-center gap-2">
            {me?.role === 'staff' && <Badge variant="secondary">View only</Badge>}
            <Button variant="ghost" size="icon" aria-label="Search" onClick={() => setPaletteOpen(true)}>
              <Search />
            </Button>
            <MobileAccountMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 md:pt-10 lg:px-10">
          {me?.role === 'staff' && <Badge variant="secondary" className="mb-4 max-md:hidden">View-only account</Badge>}
          {children}
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  );
}
