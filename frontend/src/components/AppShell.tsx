import { useEffect, type ReactNode } from 'react'
import { LayoutDashboard, Layers, LogOut, Mail } from 'lucide-react'
import { Link } from '@/components/Link'
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
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar'
import { logout } from '@/lib/auth'
import { navigate } from '@/lib/navigate'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/kampagnen', label: 'Kampagnen', icon: Mail },
  { href: '/features', label: 'Features', icon: Layers },
] as const

type AppShellProps = {
  pathname: string
  email: string
  children: ReactNode
}

export function AppShell({ pathname, email, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <AppSidebar pathname={pathname} email={email} />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger aria-label="Navigation ein- oder ausblenden" />
        </header>
        <div className="flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  )
}

function AppSidebar({ pathname, email }: { pathname: string; email: string }) {
  const { setOpenMobile } = useSidebar()

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-3">
        <Link
          href="/"
          className="px-1 text-sm font-medium tracking-[0.08em] text-primary uppercase group-data-[collapsible=icon]:hidden"
        >
          retention-ai
        </Link>
        <Link
          href="/"
          aria-label="retention-ai"
          className="hidden size-8 items-center justify-center text-sm font-medium text-primary group-data-[collapsible=icon]:flex"
        >
          R
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/'
                    ? pathname === '/'
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      render={
                        <Link
                          href={item.href}
                          aria-current={isActive ? 'page' : undefined}
                        />
                      }
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <p className="truncate px-3 py-1 text-xs text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
              {email}
            </p>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Abmelden" onClick={handleLogout}>
              <LogOut />
              <span>Abmelden</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
