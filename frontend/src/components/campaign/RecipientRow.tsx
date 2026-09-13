import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { TableCell, TableRow } from '@/components/ui/table'
import {
  isRecipientIncluded,
  type CampaignContent,
  type Recipient,
} from '@/data/campaign-review'
import { formatDate, formatPercent } from '@/lib/format'

type RecipientRowProps = {
  recipient: Recipient
  content: CampaignContent
  threshold: number
  expanded: boolean
  readOnly: boolean
  onToggleExpand: () => void
  onIncludedChange: (included: boolean) => void
}

export function RecipientRow({
  recipient,
  content,
  threshold,
  expanded,
  readOnly,
  onToggleExpand,
  onIncludedChange,
}: RecipientRowProps) {
  const override = content.overrides[recipient.id]
  const included = isRecipientIncluded(recipient, threshold, override)

  return (
    <>
      <TableRow>
        <TableCell className="w-10 pr-0">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-expanded={expanded}
            aria-label={expanded ? 'Hide match details' : 'Show match details'}
            onClick={onToggleExpand}
          >
            <ChevronDown className={expanded ? 'rotate-180' : ''} />
          </Button>
        </TableCell>
        <TableCell className="whitespace-normal">
          <p className="font-medium">{recipient.name}</p>
          <p className="text-muted-foreground">{recipient.email}</p>
        </TableCell>
        <TableCell className="whitespace-normal">{recipient.cancelReason}</TableCell>
        <TableCell className="text-muted-foreground">
          {formatDate(recipient.canceledAt)}
        </TableCell>
        <TableCell className="text-right tabular-nums">
          {formatPercent(recipient.confidence)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-2">
            {override ? (
              <Badge variant="outline">
                {override === 'include' ? 'Added' : 'Excluded'}
              </Badge>
            ) : null}
            <Checkbox
              checked={included}
              disabled={readOnly}
              aria-label={
                included ? `Exclude ${recipient.name}` : `Add ${recipient.name}`
              }
              onCheckedChange={(checked) => onIncludedChange(checked === true)}
            />
          </div>
        </TableCell>
      </TableRow>
      {expanded ? (
        <TableRow className="hover:bg-transparent">
          <TableCell />
          <TableCell colSpan={5} className="whitespace-normal text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Match reason</p>
            <p className="mt-1">{recipient.matchReason}</p>
            <p className="mt-2">
              {override
                ? override === 'include'
                  ? 'Manually added, even though the score is below the threshold.'
                  : 'Manually excluded, even though the score meets the threshold.'
                : included
                  ? 'Included because the score meets the matching threshold.'
                  : 'Left out because the score is below the matching threshold.'}
            </p>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
