import { Badge } from '@/components/ui/badge'
import type { CampaignStatus } from '@/data/mock'

const STATUS_LABEL = {
  draft: 'Draft',
  approved: 'Approved',
  sent: 'Sent',
  rejected: 'Rejected',
} as const satisfies Record<CampaignStatus, string>

const STATUS_VARIANT = {
  draft: 'outline',
  approved: 'secondary',
  sent: 'default',
  rejected: 'destructive',
} as const satisfies Record<
  CampaignStatus,
  'outline' | 'secondary' | 'default' | 'destructive'
>

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
}
