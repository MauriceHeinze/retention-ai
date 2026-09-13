import {
  effectiveThreshold,
  recipientsForCampaign,
  type CampaignContent,
} from '@/data/campaign-review'
import { featuresById, type Campaign, type Feature } from '@/data/mock'

export type FeaturePullRequest = {
  number: number
  title: string
  url: string
  mergedAt: string
}

export type FeatureEventDetail = {
  description: string
  pullRequests: FeaturePullRequest[]
  releaseNotes: string
}

export type FeatureEvent = Feature & FeatureEventDetail

export type FeatureCampaignStatus = 'draft' | 'sent'

const DETAILS: Record<string, FeatureEventDetail> = {
  sso: {
    description:
      'Companies can sign in through their existing identity provider. SAML 2.0 is available for Okta, Azure AD, and Google Workspace, so members use their work account instead of a product password. Existing sessions stay valid until they expire.',
    pullRequests: [
      {
        number: 1842,
        title: 'Enable SAML SSO for company accounts',
        url: 'https://github.com/acme/app/pull/1842',
        mergedAt: '2026-09-08',
      },
    ],
    releaseNotes:
      'SSO / SAML is generally available. Connect an identity provider in Settings → Authentication. JIT provisioning is on by default for new company accounts. Password login remains available until you turn it off.',
  },
  'audit-log': {
    description:
      'Admins can see who changed settings, who invited people, and who exported data. Each entry stores the actor, the action, and a timestamp, with filters for the last 90 days.',
    pullRequests: [
      {
        number: 1760,
        title: 'Add workspace audit log',
        url: 'https://github.com/acme/app/pull/1760',
        mergedAt: '2026-09-06',
      },
    ],
    releaseNotes:
      'The audit log is live for admins. Open Settings → Audit log to filter by person, action, or date. Exports cover the last 90 days and include actor, action, and timestamp.',
  },
  'bulk-export': {
    description:
      'Billing data can be exported in full as CSV, including invoices, payments, and tax lines. Exports run in the background and arrive by email when they are ready.',
    pullRequests: [
      {
        number: 1712,
        title: 'Background CSV export for billing data',
        url: 'https://github.com/acme/app/pull/1712',
        mergedAt: '2026-09-04',
      },
    ],
    releaseNotes:
      'Bulk export is available on all paid plans. Start an export from Billing → Export. Large files are generated in the background and sent to the requesting admin.',
  },
  'slack-alerts': {
    description:
      'Critical events are delivered directly in Slack: failed payments, upcoming renewals, and seats that are about to lapse. Each workspace can pick a channel and the events it cares about.',
    pullRequests: [
      {
        number: 1644,
        title: 'Slack alerts for billing events',
        url: 'https://github.com/acme/app/pull/1644',
        mergedAt: '2026-08-28',
      },
    ],
    releaseNotes:
      'Slack alerts are generally available. Connect a workspace in Settings → Integrations, then choose a channel for failed payments, renewals, and seat changes.',
  },
  'custom-roles': {
    description:
      'Access can be granted more finely than admin and member. Custom roles combine permissions for billing, audience, and settings so finance can export without inviting people.',
    pullRequests: [
      {
        number: 1588,
        title: 'Custom roles beyond admin and member',
        url: 'https://github.com/acme/app/pull/1588',
        mergedAt: '2026-08-18',
      },
    ],
    releaseNotes:
      'Custom roles are available for company accounts. Create a role in Settings → Members, then assign billing, audience, or settings permissions without making someone an admin.',
  },
  webhooks: {
    description:
      'Events can be forwarded to your own systems when a customer cancels, a payment fails, or a seat changes. Each endpoint has a signing secret and a delivery log.',
    pullRequests: [
      {
        number: 1510,
        title: 'Signed webhooks for billing events',
        url: 'https://github.com/acme/app/pull/1510',
        mergedAt: '2026-08-10',
      },
    ],
    releaseNotes:
      'Webhooks are in public beta. Add an endpoint in Settings → Developers, copy the signing secret, and subscribe to cancellation, payment, and seat events. Failed deliveries retry for 24 hours.',
  },
}

export function getFeatureEvent(id: string): FeatureEvent | undefined {
  const feature = featuresById.get(id)
  const detail = DETAILS[id]
  if (!feature || !detail) return undefined
  return { ...feature, ...detail }
}

export function featureCampaignStatus(
  campaign: Campaign | undefined
): FeatureCampaignStatus | null {
  if (!campaign) return null
  return campaign.status === 'sent' ? 'sent' : 'draft'
}

export function foundMatchCount(
  campaign: Campaign | undefined,
  content: CampaignContent | null,
  globalThreshold: number
) {
  if (!campaign || !content) return 0
  const threshold = effectiveThreshold(content, globalThreshold)
  return recipientsForCampaign(campaign.id, campaign.featureId).filter(
    (recipient) => recipient.confidence >= threshold
  ).length
}
