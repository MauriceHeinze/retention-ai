import { useMemo, useState } from 'react'
import { MatchPeopleTable } from '@/components/feature/MatchPeopleTable'
import { FormSelect } from '@/components/settings/FormSelect'
import { Input } from '@/components/ui/input'
import {
  effectiveThreshold,
  overrideForInclusion,
  type CampaignContent,
  type Recipient,
} from '@/data/campaign-review'
import { formatNumber } from '@/lib/format'

type FeatureAudienceProps = {
  recipients: Recipient[]
  content: CampaignContent
  globalThreshold: number
  readOnly: boolean
  onChange: (patch: Partial<CampaignContent>) => void
}

export function FeatureAudience({
  recipients,
  content,
  globalThreshold,
  readOnly,
  onChange,
}: FeatureAudienceProps) {
  const [query, setQuery] = useState('')
  const [reason, setReason] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const threshold = effectiveThreshold(content, globalThreshold)
  const reasons = useMemo(() => uniqueReasons(recipients), [recipients])
  const { matched, almost } = useMemo(
    () => splitAudience(recipients, content, threshold, query, reason),
    [recipients, content, threshold, query, reason]
  )

  function setIncluded(recipient: Recipient, included: boolean) {
    const nextOverride = overrideForInclusion(recipient, threshold, included)
    const overrides = { ...content.overrides }

    if (nextOverride) overrides[recipient.id] = nextOverride
    else delete overrides[recipient.id]

    onChange({ overrides })
  }

  function toggleExpand(id: string) {
    setExpandedId((current) => (current === id ? null : id))
  }

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-heading text-lg font-medium">Audience</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(matched.length)} matched, {formatNumber(almost.length)}{' '}
            below the {threshold}% threshold. Exclude anyone from the send, or
            add someone from the almost-matched list.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name or email"
            aria-label="Search matches"
            className="sm:w-56"
          />
          <FormSelect
            id="match-reason-filter"
            value={reason}
            options={reasons}
            onValueChange={setReason}
          />
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <h3 className="font-heading text-base font-medium">Matches</h3>
        <MatchPeopleTable
          recipients={matched}
          content={content}
          threshold={threshold}
          expandedId={expandedId}
          readOnly={readOnly}
          empty="No matches for this filter."
          includeLabel="Include"
          onToggleExpand={toggleExpand}
          onIncludedChange={setIncluded}
        />
      </section>

      <section className="flex flex-col gap-4">
        <div>
          <h3 className="font-heading text-base font-medium">Almost matched</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Former customers who were considered, but whose confidence is too
            low. Add anyone who should still receive the email.
          </p>
        </div>
        <MatchPeopleTable
          recipients={almost}
          content={content}
          threshold={threshold}
          expandedId={expandedId}
          readOnly={readOnly}
          empty="No almost-matched people for this filter."
          includeLabel="Add"
          onToggleExpand={toggleExpand}
          onIncludedChange={setIncluded}
        />
      </section>
    </div>
  )
}

function uniqueReasons(recipients: Recipient[]) {
  const values = [...new Set(recipients.map((recipient) => recipient.cancelReason))]
  return [
    { value: 'all', label: 'All reasons' },
    ...values.map((value) => ({ value, label: value })),
  ]
}

function splitAudience(
  recipients: Recipient[],
  content: CampaignContent,
  threshold: number,
  query: string,
  reason: string
) {
  const needle = query.trim().toLowerCase()
  const matched: Recipient[] = []
  const almost: Recipient[] = []

  for (const recipient of recipients) {
    if (reason !== 'all' && recipient.cancelReason !== reason) continue
    if (needle && !matchesQuery(recipient, needle)) continue

    const added = content.overrides[recipient.id] === 'include'
    if (recipient.confidence >= threshold || added) matched.push(recipient)
    else almost.push(recipient)
  }

  return { matched, almost }
}

function matchesQuery(recipient: Recipient, needle: string) {
  return (
    recipient.name.toLowerCase().includes(needle) ||
    recipient.email.toLowerCase().includes(needle) ||
    recipient.cancelReason.toLowerCase().includes(needle)
  )
}
