import { RecipientRow } from '@/components/campaign/RecipientRow'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { CampaignContent, Recipient } from '@/data/campaign-review'

type MatchPeopleTableProps = {
  recipients: Recipient[]
  content: CampaignContent
  threshold: number
  expandedId: string | null
  readOnly: boolean
  empty: string
  includeLabel: string
  onToggleExpand: (id: string) => void
  onIncludedChange: (recipient: Recipient, included: boolean) => void
}

export function MatchPeopleTable({
  recipients,
  content,
  threshold,
  expandedId,
  readOnly,
  empty,
  includeLabel,
  onToggleExpand,
  onIncludedChange,
}: MatchPeopleTableProps) {
  if (recipients.length === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-10" />
          <TableHead>Former customer</TableHead>
          <TableHead>Cancellation reason</TableHead>
          <TableHead>Cancelled</TableHead>
          <TableHead className="text-right">Confidence</TableHead>
          <TableHead className="text-right">{includeLabel}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {recipients.map((recipient) => (
          <RecipientRow
            key={recipient.id}
            recipient={recipient}
            content={content}
            threshold={threshold}
            expanded={expandedId === recipient.id}
            readOnly={readOnly}
            onToggleExpand={() => onToggleExpand(recipient.id)}
            onIncludedChange={(included) => onIncludedChange(recipient, included)}
          />
        ))}
      </TableBody>
    </Table>
  )
}
