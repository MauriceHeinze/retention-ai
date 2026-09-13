import { Link } from '@/components/Link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { features, getCampaignsForFeature } from '@/data/mock'

export default function FeaturesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Features</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Features aus gemergten PRs. Die Event-Übersicht folgt als nächster Schritt.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Feature</TableHead>
            <TableHead>Beschreibung</TableHead>
            <TableHead className="text-right">Kampagnen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.id}>
              <TableCell>
                <Link
                  href={`/features/${feature.id}`}
                  className="font-medium text-primary underline-offset-4 hover:underline"
                >
                  {feature.title}
                </Link>
              </TableCell>
              <TableCell className="max-w-md truncate text-muted-foreground">
                {feature.summary}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {getCampaignsForFeature(feature.id).length}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
