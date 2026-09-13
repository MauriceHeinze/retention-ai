import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { FormSelect } from '@/components/settings/FormSelect'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  effectiveThreshold,
  filterRecipients,
  isRecipientIncluded,
  overrideForInclusion,
  type CampaignContent,
  type Recipient,
  type RecipientFilter,
} from '@/data/campaign-review'
import { formatDate, formatPercent } from '@/lib/format'

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'included', label: 'Included' },
  { value: 'excluded', label: 'Excluded' },
  { value: 'manual', label: 'Manual overrides' },
] as const

type RecipientTableProps = {
  recipients: Recipient[]
  content: CampaignContent
  globalThreshold: number
  readOnly: boolean
  onChange: (patch: Partial<CampaignContent>) => void
}

export function RecipientTable({
  recipients,
  content,
  globalThreshold,
  readOnly,
  onChange,
}: RecipientTableProps) {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<RecipientFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const threshold = effectiveThreshold(content, globalThreshold)
  const rows = useMemo(
    () => filterRecipients(recipients, content, globalThreshold, query, filter),
    [recipients, content, globalThreshold, query, filter]
  )

  function setIncluded(recipient: Recipient, included: boolean) {
    const nextOverride = overrideForInclusion(recipient, threshold, included)
    const overrides = { ...content.overrides }

    if (nextOverride) overrides[recipient.id] = nextOverride
    else delete overrides[recipient.id]

    onChange({ overrides })
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium">Recipients</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Include or exclude anyone without changing the threshold.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search recipients"
            className="sm:w-56"
          />
          <FormSelect
            id="recipient-filter"
            value={filter}
            options={FILTER_OPTIONS}
            onValueChange={(value) => setFilter(value as RecipientFilter)}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No recipients match this filter.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10" />
              <TableHead>Name / email</TableHead>
              <TableHead>Cancellation reason</TableHead>
              <TableHead>Cancelled</TableHead>
              <TableHead className="text-right">Confidence</TableHead>
              <TableHead className="text-right">Include</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((recipient) => (
              <RecipientRows
                key={recipient.id}
                recipient={recipient}
                content={content}
                threshold={threshold}
                expanded={expandedId === recipient.id}
                readOnly={readOnly}
                onToggleExpand={() =>
                  setExpandedId((current) =>
                    current === recipient.id ? null : recipient.id
                  )
                }
                onIncludedChange={(included) => setIncluded(recipient, included)}
              />
            ))}
          </TableBody>
        </Table>
      )}
    </section>
  )
}

function RecipientRows({
  recipient,
  content,
  threshold,
  expanded,
  readOnly,
  onToggleExpand,
  onIncludedChange,
}: {
  recipient: Recipient
  content: CampaignContent
  threshold: number
  expanded: boolean
  readOnly: boolean
  onToggleExpand: () => void
  onIncludedChange: (included: boolean) => void
}) {
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
              <Badge variant="outline">{override === 'include' ? 'Forced in' : 'Forced out'}</Badge>
            ) : null}
            <Checkbox
              checked={included}
              disabled={readOnly}
              aria-label={`Include ${recipient.name}`}
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
                  ? 'Manually included, even if the score is below the threshold.'
                  : 'Manually excluded, even if the score meets the threshold.'
                : included
                  ? 'Included because the score meets the campaign threshold.'
                  : 'Excluded because the score is below the campaign threshold.'}
            </p>
          </TableCell>
        </TableRow>
      ) : null}
    </>
  )
}
