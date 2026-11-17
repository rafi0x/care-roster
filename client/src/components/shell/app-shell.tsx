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
  SidebarGroupLabel,
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
  const { setOpenMobile } = useSidebar();
  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
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
        <SidebarHeader className="px-5 pb-2 pt-6">
          <Link href="/" className="flex items-center gap-3 font-heading text-lg font-semibold text-white">
            <span className="grid size-9 place-items-center rounded-xl bg-white/10" aria-hidden>
              <Stethoscope className="size-5" />
            </span>
            Doctor Tracker
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup className="px-3 pt-4">
            <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wider text-sidebar-foreground/50">Menu</SidebarGroupLabel>
            <SidebarGroupContent>
              <NavMenu />
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border p-3">
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
