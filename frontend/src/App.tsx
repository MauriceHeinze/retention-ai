import { useSyncExternalStore } from 'react'
import { AppShell } from '@/components/AppShell'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { getSession, subscribeToSession } from '@/lib/auth'
import {
  campaignIdFromPath,
  getPathname,
  isCampaignsPath,
  isSettingsPath,
  subscribeToPath,
} from '@/lib/navigate'
import CampaignReviewPage from '@/pages/CampaignReviewPage'
import CampaignsPage from '@/pages/CampaignsPage'
import DashboardPage from '@/pages/DashboardPage'
import FeatureDetailPage from '@/pages/FeatureDetailPage'
import FeaturesPage from '@/pages/FeaturesPage'
import LoginPage from '@/pages/LoginPage'
import GitHubSettingsPage from '@/pages/settings/GitHubSettingsPage'
import IntegrationsOverviewPage from '@/pages/settings/IntegrationsOverviewPage'
import LanguageAndVoicePage from '@/pages/settings/LanguageAndVoicePage'
import MailchimpSettingsPage from '@/pages/settings/MailchimpSettingsPage'
import MatchingPage from '@/pages/settings/MatchingPage'
import SlackSettingsPage from '@/pages/settings/SlackSettingsPage'
import StripeSettingsPage from '@/pages/settings/StripeSettingsPage'
import TemplatePage from '@/pages/settings/TemplatePage'

function App() {
  const pathname = useSyncExternalStore(subscribeToPath, getPathname, () => '/')
  const session = useSyncExternalStore(subscribeToSession, getSession, () => null)

  if (!session) {
    const redirectTo = pathname === '/login' ? '/' : pathname
    return <LoginPage redirectTo={redirectTo} />
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

  if (isCampaignsPath(pathname)) {
    const campaignId = campaignIdFromPath(pathname)
    if (campaignId) return <CampaignReviewPage campaignId={campaignId} />
    return <CampaignsPage />
  }

  if (pathname === '/features') {
    return <FeaturesPage />
  }

  if (pathname.startsWith('/features/')) {
    const featureId = decodeURIComponent(pathname.slice('/features/'.length))
    return <FeatureDetailPage featureId={featureId} />
  }

  if (isSettingsPath(pathname)) {
    return (
      <SettingsLayout pathname={pathname}>
        <SettingsRoute pathname={pathname} />
      </SettingsLayout>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        Page not found
      </h1>
      <p className="text-sm text-muted-foreground">This route does not exist.</p>
    </div>
  )
}

function SettingsRoute({ pathname }: { pathname: string }) {
  if (pathname === '/settings' || pathname === '/settings/integrations') {
    return <IntegrationsOverviewPage />
  }

  if (pathname === '/settings/integrations/stripe') {
    return <StripeSettingsPage />
  }

  if (pathname === '/settings/integrations/github') {
    return <GitHubSettingsPage />
  }

  if (pathname === '/settings/integrations/mailchimp') {
    return <MailchimpSettingsPage />
  }

  if (pathname === '/settings/integrations/slack') {
    return <SlackSettingsPage />
  }

  if (pathname === '/settings/matching') {
    return <MatchingPage />
  }

  if (pathname === '/settings/language-and-voice') {
    return <LanguageAndVoicePage />
  }

  if (pathname === '/settings/template') {
    return <TemplatePage />
  }

  return (
    <div className="flex flex-col gap-2">
      <h1 className="font-heading text-2xl font-medium tracking-tight">
        Settings page not found
      </h1>
      <p className="text-sm text-muted-foreground">This settings route does not exist.</p>
    </div>
  )
}

export default App
