import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { Link } from '@/components/Link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLiveData } from '@/lib/live-data'
import { LiveToolbar } from '@/components/live/LiveToolbar'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'

function Dash() {
  return <span className="text-muted-foreground">—</span>
}

export default function CampaignsPage() {
  const { campaigns, featuresById, isLoading, error, refresh } = useLiveData()
  const sortedCampaigns = [...campaigns].sort((a, b) => {
    const aDate = a.sentAt ?? a.updatedAt
    const bDate = b.sentAt ?? b.updatedAt
    return bDate.localeCompare(aDate)
  })

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Campaigns</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Personal email drafts from real release analysis. Open a campaign to review and approve outreach.
        </p>
      </div>

      <LiveToolbar isLoading={isLoading} error={error} onRefresh={refresh} />

      {sortedCampaigns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Campaign</TableHead>
              <TableHead>Feature</TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Recipients</TableHead>
              <TableHead className="text-right">Sent</TableHead>
              <TableHead className="text-right">Recovered</TableHead>
              <TableHead className="text-right">Revenue recovered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCampaigns.map((campaign) => {
              const feature = featuresById.get(campaign.featureId)
              const sent = campaign.status === 'sent'

              return (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium whitespace-normal">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="underline-offset-4 hover:underline"
                    >
                      {campaign.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {feature ? (
                      <Link
                        href={`/features/${feature.id}`}
                        className="text-primary underline-offset-4 hover:underline"
                      >
                        {feature.title}
                      </Link>
                    ) : (
                      <Dash />
                    )}
                  </TableCell>
                  <TableCell>{campaign.audience}</TableCell>
                  <TableCell>
                    <CampaignStatusBadge status={campaign.status} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatNumber(campaign.recipientCount)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {campaign.sentAt ? formatDate(campaign.sentAt) : <Dash />}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sent ? formatNumber(campaign.recoveredCustomers) : <Dash />}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {sent ? formatCurrency(campaign.recoveredRevenue) : <Dash />}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
