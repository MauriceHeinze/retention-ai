export type IntegrationStatus = 'connected' | 'error' | 'not_connected'
export type IntegrationId = 'stripe' | 'github' | 'mailchimp' | 'slack'
export type DefaultLanguage = 'en' | 'de' | 'auto'

export type StripeSettings = {
  status: IntegrationStatus
  account: string | null
  dataSource: string
}

export type GitHubSettings = {
  status: IntegrationStatus
  account: string | null
  organization: string
  repositories: string[]
}

export type MailchimpSettings = {
  status: IntegrationStatus
  account: string | null
  audience: string
  template: string
  errorMessage: string | null
}

export type SlackSettings = {
  status: IntegrationStatus
  account: string | null
  channel: string
  owners: string[]
}

export type AppSettings = {
  stripe: StripeSettings
  github: GitHubSettings
  mailchimp: MailchimpSettings
  slack: SlackSettings
  matching: { minMatchStrength: number }
  language: { defaultLanguage: DefaultLanguage; brandVoice: string }
  template: { html: string }
}

export const BRAND_VOICE_MAX_WORDS = 10_000

export const stripeDataSources = [
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'customers', label: 'Customers' },
  { value: 'invoices', label: 'Invoices' },
] as const

export const githubOrganizations = [
  {
    value: 'acme-gmbh',
    label: 'acme-gmbh',
    repositories: ['retention-ai', 'billing-service', 'web-app'],
  },
  {
    value: 'acme-labs',
    label: 'acme-labs',
    repositories: ['docs', 'experiments'],
  },
] as const

export const mailchimpAudiences = [
  { value: 'churned', label: 'Churned customers' },
  { value: 'trial-expired', label: 'Trial expired' },
  { value: 'all-contacts', label: 'All contacts' },
] as const

export const mailchimpTemplates = [
  { value: 'feature-announcement', label: 'Feature announcement' },
  { value: 'win-back', label: 'Win-back' },
  { value: 'product-update', label: 'Product update' },
] as const

export const slackChannels = [
  { value: '#customer-success', label: '#customer-success' },
  { value: '#retention', label: '#retention' },
  { value: '#growth', label: '#growth' },
] as const

export const slackPeople = [
  { value: 'lena-hoff', label: 'Lena Hoff' },
  { value: 'jonas-berg', label: 'Jonas Berg' },
  { value: 'mira-khan', label: 'Mira Khan' },
] as const

export const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'de', label: 'German' },
  { value: 'auto', label: 'Automatically detect' },
] as const

export const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
  <body style="margin:0;background:#f4f4f5;font-family:Inter,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px;">
            <tr>
              <td style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#4f46e5;">
                retention-ai
              </td>
            </tr>
            <tr>
              <td style="padding-top:16px;font-size:24px;line-height:1.3;">
                {{feature_title}} is now available
              </td>
            </tr>
            <tr>
              <td style="padding-top:12px;font-size:15px;line-height:1.6;color:#3f3f46;">
                {{body}}
              </td>
            </tr>
            <tr>
              <td style="padding-top:24px;">
                <a href="{{cta_url}}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;padding:10px 16px;">
                  See what is new
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`

export const defaultSettings: AppSettings = {
  stripe: {
    status: 'connected',
    account: 'Acme GmbH',
    dataSource: 'subscriptions',
  },
  github: {
    status: 'connected',
    account: 'acme-gmbh',
    organization: 'acme-gmbh',
    repositories: ['retention-ai', 'billing-service'],
  },
  mailchimp: {
    status: 'error',
    account: 'Acme',
    audience: 'churned',
    template: 'feature-announcement',
    errorMessage: 'The last audience sync failed. Try again after checking the selected list.',
  },
  slack: {
    status: 'not_connected',
    account: null,
    channel: '#customer-success',
    owners: ['lena-hoff'],
  },
  matching: { minMatchStrength: 75 },
  language: { defaultLanguage: 'en', brandVoice: '' },
  template: { html: DEFAULT_EMAIL_TEMPLATE },
}

export const integrationMeta: Record<
  IntegrationId,
  { name: string; href: string; description: string }
> = {
  stripe: {
    name: 'Stripe',
    href: '/settings/integrations/stripe',
    description: 'Account and billing data used to find former customers.',
  },
  github: {
    name: 'GitHub',
    href: '/settings/integrations/github',
    description: 'Organization and repositories that feed new feature events.',
  },
  mailchimp: {
    name: 'Mailchimp',
    href: '/settings/integrations/mailchimp',
    description: 'Audience and template used to send campaign emails.',
  },
  slack: {
    name: 'Slack',
    href: '/settings/integrations/slack',
    description: 'Channel and people responsible for campaign reviews.',
  },
}

export function getIntegrationStatus(
  settings: AppSettings,
  id: IntegrationId
): IntegrationStatus {
  return settings[id].status
}

export function getIntegrationAccount(settings: AppSettings, id: IntegrationId) {
  return settings[id].account
}

export function countWords(text: string) {
  const trimmed = text.trim()
  if (!trimmed) return 0
  return trimmed.split(/\s+/).length
}

export function clampWordCount(text: string, maxWords: number) {
  const trimmed = text.trim()
  if (!trimmed) return text
  const words = text.trimStart().split(/\s+/)
  if (words.length <= maxWords) return text
  return words.slice(0, maxWords).join(' ')
}

export function githubReposForOrg(organization: string) {
  const org = githubOrganizations.find((item) => item.value === organization)
  return org ? [...org.repositories] : []
}
