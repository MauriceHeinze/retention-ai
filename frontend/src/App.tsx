import { useSyncExternalStore } from 'react'
import { AppShell } from '@/components/AppShell'
import { getSession, subscribeToSession } from '@/lib/auth'
import { getPathname, subscribeToPath } from '@/lib/navigate'
import CampaignsPage from '@/pages/CampaignsPage'
import DashboardPage from '@/pages/DashboardPage'
import FeatureDetailPage from '@/pages/FeatureDetailPage'
import FeaturesPage from '@/pages/FeaturesPage'
import LoginPage from '@/pages/LoginPage'

function App() {
  const pathname = useSyncExternalStore(subscribeToPath, getPathname, () => '/')
  const session = useSyncExternalStore(subscribeToSession, getSession, () => null)

  if (!session) {
    return <LoginPage />
  }

  return (
    <AppShell pathname={pathname} email={session}>
      <AppRoute pathname={pathname} />
    </AppShell>
  )
}

function AppRoute({ pathname }: { pathname: string }) {
  if (pathname === '/' || pathname === '/login' || pathname === '/dashboard') {
    return <DashboardPage />
  }

  if (pathname === '/kampagnen') {
    return <CampaignsPage />
  }

  if (pathname === '/features') {
    return <FeaturesPage />
  }

  if (pathname.startsWith('/features/')) {
    const featureId = decodeURIComponent(pathname.slice('/features/'.length))
    return <FeatureDetailPage featureId={featureId} />
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        Seite nicht gefunden
      </h1>
      <p className="text-sm text-muted-foreground">Diese Route gibt es nicht.</p>
    </div>
  )
}

export default App
