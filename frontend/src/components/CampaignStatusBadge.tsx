import { Badge } from '@/components/ui/badge'
import type { CampaignStatus } from '@/data/mock'

const STATUS_LABEL: Record<CampaignStatus, string> = {
  draft: 'Entwurf',
  approved: 'Freigegeben',
  sent: 'Versendet',
  rejected: 'Zurückgewiesen',
}

const STATUS_VARIANT: Record<
  CampaignStatus,
  'outline' | 'secondary' | 'default' | 'destructive'
> = {
  draft: 'outline',
  approved: 'secondary',
  sent: 'default',
  rejected: 'destructive',
}

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
