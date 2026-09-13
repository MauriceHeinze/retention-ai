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
import { campaigns, featuresById } from '@/data/mock'
import { formatDate } from '@/lib/format'

const sortedCampaigns = [...campaigns].sort((a, b) =>
  b.updatedAt.localeCompare(a.updatedAt)
)

export default function CampaignsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Kampagnen</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alle Kampagnen inklusive Entwürfe. Die vollständige Übersicht folgt als
          nächster Schritt.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Kampagne</TableHead>
            <TableHead>Feature</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Aktualisiert</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedCampaigns.map((campaign) => {
            const feature = featuresById.get(campaign.featureId)

            return (
              <TableRow key={campaign.id}>
                <TableCell className="font-medium">{campaign.name}</TableCell>
                <TableCell>
                  {feature ? (
                    <Link
                      href={`/features/${feature.id}`}
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      {feature.title}
                    </Link>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <CampaignStatusBadge status={campaign.status} />
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatDate(campaign.updatedAt)}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
