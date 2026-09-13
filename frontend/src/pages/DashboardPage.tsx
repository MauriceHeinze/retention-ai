import { ArrowUpRight } from 'lucide-react'
import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { Link } from '@/components/Link'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { featuresById } from '@/data/mock'
import { useCampaigns } from '@/lib/campaign-store'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'

export default function DashboardPage() {
  const campaigns = useCampaigns()
  const recentCampaigns = [...campaigns]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 3)
  const kpis = campaigns.reduce(
    (totals, campaign) => {
      if (campaign.status !== 'sent') return totals
      return {
        recoveredCustomers: totals.recoveredCustomers + campaign.recoveredCustomers,
        recoveredRevenue: totals.recoveredRevenue + campaign.recoveredRevenue,
      }
    },
    { recoveredCustomers: 0, recoveredRevenue: 0 }
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Latest campaigns, including drafts, and customers recovered so far.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-10">
        <Card className="xl:col-span-7">
          <CardHeader className="border-b">
            <CardTitle>Campaigns</CardTitle>
            <CardDescription>
              The latest three campaigns, including drafts.
            </CardDescription>
            <CardAction>
              <Link
                href="/campaigns"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                View all
                <ArrowUpRight className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {recentCampaigns.length === 0 ? (
              <p className="px-(--card-spacing) text-sm text-muted-foreground">
                No campaigns yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Campaign</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Updated
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCampaigns.map((campaign) => {
                    const feature = featuresById.get(campaign.featureId)

                    return (
                      <TableRow key={campaign.id}>
                        <TableCell className="whitespace-normal">
                          <Link
                            href={`/campaigns/${campaign.id}`}
                            className="font-medium underline-offset-4 hover:underline"
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
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <CampaignStatusBadge status={campaign.status} />
                        </TableCell>
                        <TableCell className="hidden text-right text-muted-foreground md:table-cell">
                          {formatDate(campaign.updatedAt)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="xl:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>KPIs</CardTitle>
            <CardDescription>Recovered customers and revenue.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Customers recovered</p>
              <p className="mt-1 font-heading text-3xl font-medium tabular-nums tracking-tight">
                {formatNumber(kpis.recoveredCustomers)}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Revenue recovered</p>
              <p className="mt-1 font-heading text-3xl font-medium tabular-nums tracking-tight">
                {formatCurrency(kpis.recoveredRevenue)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
