export type CampaignStatus = 'draft' | 'approved' | 'sent' | 'rejected'

export type Feature = {
  id: string
  title: string
  summary: string
}

export type Campaign = {
  id: string
  name: string
  featureId: string
  status: CampaignStatus
  updatedAt: string
  recoveredCustomers: number
  recoveredRevenue: number
}

export const features: Feature[] = [
  {
    id: 'sso',
    title: 'SSO / SAML',
    summary:
      'Unternehmen können sich über den bestehenden Identity Provider anmelden.',
  },
  {
    id: 'audit-log',
    title: 'Audit-Log',
    summary: 'Admins sehen nachvollziehbar, wer Einstellungen geändert hat.',
  },
  {
    id: 'bulk-export',
    title: 'Bulk-Export',
    summary: 'Abrechnungsdaten lassen sich vollständig als CSV exportieren.',
  },
  {
    id: 'slack-alerts',
    title: 'Slack-Benachrichtigungen',
    summary: 'Kritische Ereignisse werden direkt in Slack zugestellt.',
  },
  {
    id: 'custom-roles',
    title: 'Benutzerdefinierte Rollen',
    summary: 'Zugriffsrechte können feiner als nur Admin und Mitglied vergeben werden.',
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    summary: 'Events können an eigene Systeme weitergeleitet werden.',
  },
]

export const featuresById = new Map(features.map((feature) => [feature.id, feature]))

export const campaigns: Campaign[] = [
  {
    id: 'cmp-sso',
    name: 'SSO ist jetzt verfügbar',
    featureId: 'sso',
    status: 'draft',
    updatedAt: '2026-09-12',
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
  {
    id: 'cmp-audit',
    name: 'Audit-Log für Admins',
    featureId: 'audit-log',
    status: 'draft',
    updatedAt: '2026-09-11',
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
  {
    id: 'cmp-export',
    name: 'Bulk-Export der Abrechnungen',
    featureId: 'bulk-export',
    status: 'approved',
    updatedAt: '2026-09-10',
    recoveredCustomers: 0,
    recoveredRevenue: 0,
  },
  {
    id: 'cmp-slack',
    name: 'Slack-Alerts sind live',
    featureId: 'slack-alerts',
    status: 'sent',
    updatedAt: '2026-09-02',
    recoveredCustomers: 18,
    recoveredRevenue: 6120,
  },
  {
    id: 'cmp-roles',
    name: 'Eigene Rollen und Rechte',
    featureId: 'custom-roles',
    status: 'sent',
    updatedAt: '2026-08-21',
    recoveredCustomers: 29,
    recoveredRevenue: 6720,
  },
  {
    id: 'cmp-webhooks',
    name: 'Webhooks für Integrationen',
    featureId: 'webhooks',
    status: 'rejected',
    updatedAt: '2026-08-14',
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
