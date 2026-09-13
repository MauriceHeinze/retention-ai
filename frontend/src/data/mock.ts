export const CAMPAIGN_STATUSES = [
  'draft',
  'approved',
  'accepted',
  'sent',
  'rejected',
] as const

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

export type Feature = {
  id: string
  title: string
  summary: string
}

export type Campaign = {
  id: string
  name: string
  featureId: string
  audience: string
  status: CampaignStatus
  updatedAt: string
  recipientCount: number
  sentAt: string | null
  recoveredCustomers: number
  recoveredRevenue: number
}

export const features: Feature[] = [
  {
    id: 'sso',
    title: 'SSO / SAML',
    summary: 'Companies can sign in through their existing identity provider.',
  },
  {
    id: 'audit-log',
    title: 'Audit log',
    summary: 'Admins can see who changed settings.',
  },
  {
    id: 'bulk-export',
    title: 'Bulk export',
    summary: 'Billing data can be exported in full as CSV.',
  },
  {
    id: 'slack-alerts',
    title: 'Slack alerts',
    summary: 'Critical events are delivered directly in Slack.',
  },
  {
    id: 'custom-roles',
    title: 'Custom roles',
    summary: 'Access can be granted more finely than admin and member.',
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    summary: 'Events can be forwarded to your own systems.',
  },
]

export const featuresById = new Map(features.map((feature) => [feature.id, feature]))

export const campaigns: Campaign[] = [
  {
    id: 'cmp-sso',
    name: 'SSO is now available',
    featureId: 'sso',
    audience: 'Churned customers',
    status: 'draft',
    updatedAt: '2026-09-12',
    recipientCount: 42,
    sentAt: null,
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
  {
    id: 'cmp-audit',
    name: 'Audit log for admins',
    featureId: 'audit-log',
    audience: 'Churned customers',
    status: 'draft',
    updatedAt: '2026-09-11',
    recipientCount: 31,
    sentAt: null,
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
  {
    id: 'cmp-export',
    name: 'Bulk export for billing',
    featureId: 'bulk-export',
    audience: 'Trial expired',
    status: 'approved',
    updatedAt: '2026-09-10',
    recipientCount: 58,
    sentAt: null,
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
  {
    id: 'cmp-slack',
    name: 'Slack alerts are live',
    featureId: 'slack-alerts',
    audience: 'Churned customers',
    status: 'sent',
    updatedAt: '2026-09-02',
    recipientCount: 214,
    sentAt: '2026-09-02',
    recoveredCustomers: 18,
    recoveredRevenue: 6120,
  },
  {
    id: 'cmp-roles',
    name: 'Custom roles and permissions',
    featureId: 'custom-roles',
    audience: 'Churned customers',
    status: 'sent',
    updatedAt: '2026-08-21',
    recipientCount: 186,
    sentAt: '2026-08-21',
    recoveredCustomers: 29,
    recoveredRevenue: 6720,
  },
  {
    id: 'cmp-webhooks',
    name: 'Webhooks for integrations',
    featureId: 'webhooks',
    audience: 'Churned customers',
    status: 'rejected',
    updatedAt: '2026-08-14',
    recipientCount: 47,
    sentAt: null,
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
]

export const recentCampaigns = [...campaigns]
  .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  .slice(0, 3)

export const kpis = campaigns.reduce(
  (totals, campaign) => {
    if (campaign.status !== 'sent') return totals
    return {
      recoveredCustomers: totals.recoveredCustomers + campaign.recoveredCustomers,
      recoveredRevenue: totals.recoveredRevenue + campaign.recoveredRevenue,
    }
  },
  { recoveredCustomers: 0, recoveredRevenue: 0 }
)

export function getFeature(id: string) {
  return featuresById.get(id)
}

export function getCampaignsForFeature(featureId: string) {
  return campaigns.filter((campaign) => campaign.featureId === featureId)
}
