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
import { featuresById, kpis, recentCampaigns } from '@/data/mock'
import { formatCurrency, formatDate, formatNumber } from '@/lib/format'

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Letzte Kampagnen inklusive Entwürfe und bisher zurückgewonnene Kunden.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-10">
        <Card className="xl:col-span-7">
          <CardHeader className="border-b">
            <CardTitle>Kampagnen</CardTitle>
            <CardDescription>
              Die letzten drei aus allen Kampagnen, inklusive Entwürfe.
            </CardDescription>
            <CardAction>
              <Link
                href="/kampagnen"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Alle ansehen
                <ArrowUpRight className="size-4" />
              </Link>
            </CardAction>
          </CardHeader>
          <CardContent className="px-0">
            {recentCampaigns.length === 0 ? (
              <p className="px-(--card-spacing) text-sm text-muted-foreground">
                Noch keine Kampagnen vorhanden.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Kampagne</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden text-right md:table-cell">
                      Aktualisiert
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
                            href="/kampagnen"
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
            <CardDescription>Zurückgewonnene Kunden und Umsatz.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Zurückgewonnene Kunden</p>
              <p className="mt-1 font-heading text-3xl font-medium tabular-nums tracking-tight">
                {formatNumber(kpis.recoveredCustomers)}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-sm text-muted-foreground">Zurückgewonnener Umsatz</p>
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
