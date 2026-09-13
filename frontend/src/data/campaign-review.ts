import { featuresById, type Campaign } from '@/data/mock'

export type InclusionOverride = 'include' | 'exclude'
export type RecipientFilter = 'all' | 'included' | 'excluded' | 'manual'

export type Recipient = {
  id: string
  name: string
  email: string
  cancelReason: string
  canceledAt: string
  matchReason: string
  confidence: number
}

export type CampaignContent = {
  subject: string
  previewText: string
  fromName: string
  fromEmail: string
  body: string
  useGlobalThreshold: boolean
  localThreshold: number
  overrides: Record<string, InclusionOverride>
}

const FIRST_NAMES = [
  'Anna', 'Jonas', 'Mira', 'Lena', 'Paul', 'Sara', 'Tim', 'Nora',
  'Luis', 'Eva', 'Max', 'Ida', 'Nina', 'Omar', 'Pia', 'Ben',
]

const LAST_NAMES = [
  'Hoff', 'Berg', 'Khan', 'Vogel', 'Stein', 'Keller', 'Hart', 'Lang',
  'Koch', 'Wolf', 'Klein', 'Braun',
]

const CANCEL_REASONS = [
  'Too expensive',
  'Missing feature',
  'Switched to a competitor',
  'Low usage',
  'Contract ended',
  'Missing integrations',
]

const RECIPIENT_COUNTS: Record<string, number> = {
  'cmp-sso': 64,
  'cmp-audit': 48,
  'cmp-export': 58,
  'cmp-slack': 80,
  'cmp-roles': 72,
  'cmp-webhooks': 47,
}

export function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export function effectiveThreshold(
  content: CampaignContent,
  globalThreshold: number
) {
  return content.useGlobalThreshold ? globalThreshold : content.localThreshold
}

export function isRecipientIncluded(
  recipient: Recipient,
  threshold: number,
  override?: InclusionOverride
) {
  if (override === 'include') return true
  if (override === 'exclude') return false
  return recipient.confidence >= threshold
}

export function overrideForInclusion(
  recipient: Recipient,
  threshold: number,
  included: boolean
): InclusionOverride | undefined {
  const byThreshold = recipient.confidence >= threshold
  if (included === byThreshold) return undefined
  return included ? 'include' : 'exclude'
}

export function countIncluded(
  recipients: Recipient[],
  content: CampaignContent,
  globalThreshold: number
) {
  const threshold = effectiveThreshold(content, globalThreshold)
  return recipients.filter((recipient) =>
    isRecipientIncluded(recipient, threshold, content.overrides[recipient.id])
  ).length
}

export function recipientsForCampaign(
  campaignId: string,
  featureId: string
): Recipient[] {
  const title = featuresById.get(featureId)?.title ?? 'this feature'
  const count = RECIPIENT_COUNTS[campaignId] ?? 40

  return Array.from({ length: count }, (_, index) => {
    const first = FIRST_NAMES[index % FIRST_NAMES.length]!
    const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]!
    const n = index + 1
    const confidence = 48 + ((index * 17 + campaignId.length * 3) % 52)
    const day = String((index % 27) + 1).padStart(2, '0')
    const month = String((index % 8) + 1).padStart(2, '0')

    return {
      id: `${campaignId}-r${n}`,
      name: `${first} ${last}`,
      email: `${first}.${last}${n}@example.com`.toLowerCase(),
      cancelReason: CANCEL_REASONS[index % CANCEL_REASONS.length]!,
      canceledAt: `2026-${month}-${day}`,
      matchReason: matchReasonFor(title, index),
      confidence,
    }
  })
}

export function defaultCampaignContent(campaign: Campaign): CampaignContent {
  const title = featuresById.get(campaign.featureId)?.title ?? campaign.name

  return {
    subject: campaign.name,
    previewText: 'You asked about this. Setup takes a few minutes.',
    fromName: 'Acme',
    fromEmail: 'hello@acme.com',
    body: `Hi {{first_name}},\n\nyou asked about ${title}. It is live now — and setup takes a few minutes.`,
    useGlobalThreshold: true,
    localThreshold: 75,
    overrides: {},
  }
}

export function filterRecipients(
  recipients: Recipient[],
  content: CampaignContent,
  globalThreshold: number,
  query: string,
  filter: RecipientFilter
) {
  const threshold = effectiveThreshold(content, globalThreshold)
  const needle = query.trim().toLowerCase()

  return recipients.filter((recipient) => {
    const override = content.overrides[recipient.id]
    const included = isRecipientIncluded(recipient, threshold, override)

    if (filter === 'included' && !included) return false
    if (filter === 'excluded' && included) return false
    if (filter === 'manual' && !override) return false
    if (!needle) return true

    return (
      recipient.name.toLowerCase().includes(needle) ||
      recipient.email.toLowerCase().includes(needle) ||
      recipient.cancelReason.toLowerCase().includes(needle)
    )
  })
}

export function renderCampaignEmail(
  template: string,
  vars: {
    feature_title: string
    first_name: string
    cta_url: string
    body: string
  }
) {
  const body = vars.body.replaceAll('{{first_name}}', vars.first_name)
  const bodyHtml = escapeHtml(body).replaceAll('\n', '<br>')
  let html = template

  if (html.includes('{{body}}')) {
    html = html.replaceAll('{{body}}', bodyHtml)
  }

  return html
    .replaceAll('{{feature_title}}', escapeHtml(vars.feature_title))
    .replaceAll('{{first_name}}', escapeHtml(vars.first_name))
    .replaceAll('{{cta_url}}', vars.cta_url)
}

export function mailchimpUrl(mailchimpId: string) {
  return `https://admin.mailchimp.com/campaigns/show?id=${encodeURIComponent(mailchimpId)}`
}

function matchReasonFor(title: string, index: number) {
  const reasons = [
    `Cancellation feedback mentioned ${title}`,
    `Support ticket asked for ${title}`,
    `Sales call listed ${title} as a blocker`,
    `Used a workaround instead of ${title}`,
    `Renewal notes flagged ${title}`,
  ]
  return reasons[index % reasons.length]!
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}
