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

export const FEATURE_TABS = ['feature', 'matches', 'draft'] as const
export type FeatureTab = (typeof FEATURE_TABS)[number]

export function isFeaturesPath(pathname: string) {
  return pathname === '/features' || pathname.startsWith('/features/')
}

export function featureHref(id: string, tab: FeatureTab = 'feature') {
  const encoded = encodeURIComponent(id)
  return tab === 'feature' ? `/features/${encoded}` : `/features/${encoded}/${tab}`
}

export function parseFeaturePath(pathname: string) {
  if (!pathname.startsWith('/features/')) return null
  const rest = pathname.slice('/features/'.length)
  if (!rest) return null

  const [rawId, rawTab] = rest.split('/')
  if (!rawId) return null

  const tab = FEATURE_TABS.includes(rawTab as FeatureTab)
    ? (rawTab as FeatureTab)
    : 'feature'

  return { featureId: decodeURIComponent(rawId), tab }
}
