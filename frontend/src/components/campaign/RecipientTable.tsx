import { useMemo, useState } from 'react'
import { RecipientRow } from '@/components/campaign/RecipientRow'
import { FormSelect } from '@/components/settings/FormSelect'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  effectiveThreshold,
  filterRecipients,
  overrideForInclusion,
  type CampaignContent,
  type Recipient,
  type RecipientFilter,
} from '@/data/campaign-review'

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
              <RecipientRow
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
