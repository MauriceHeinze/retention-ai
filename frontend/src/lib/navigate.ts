type NavigationGuard = (to: string) => boolean

let guard: NavigationGuard | null = null

export function setNavigationGuard(next: NavigationGuard | null) {
  guard = next
}

function pushPath(to: string) {
  window.history.pushState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function navigate(to: string) {
  if (window.location.pathname === to) return
  if (guard && !guard(to)) return
  pushPath(to)
}

export function navigateUnchecked(to: string) {
  if (window.location.pathname === to) return
  pushPath(to)
}

export function replacePath(to: string) {
  if (window.location.pathname === to) return
  window.history.replaceState({}, '', to)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function subscribeToPath(onStoreChange: () => void) {
  window.addEventListener('popstate', onStoreChange)
  return () => window.removeEventListener('popstate', onStoreChange)
}

export function getPathname() {
  return window.location.pathname
}

export function isSettingsPath(pathname: string) {
  return pathname === '/settings' || pathname.startsWith('/settings/')
}

export function isCampaignsPath(pathname: string) {
  return (
    pathname === '/campaigns' ||
    pathname.startsWith('/campaigns/') ||
    pathname === '/kampagnen' ||
    pathname.startsWith('/kampagnen/')
  )
}

export function campaignIdFromPath(pathname: string) {
  for (const prefix of ['/campaigns/', '/kampagnen/'] as const) {
    if (pathname.startsWith(prefix)) {
      return decodeURIComponent(pathname.slice(prefix.length))
    }
  }
  return null
}
