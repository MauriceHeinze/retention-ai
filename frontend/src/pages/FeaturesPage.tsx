import { useMemo, useState } from 'react'
import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { IgnoreFeatureDialog } from '@/components/feature/IgnoreFeatureDialog'
import { Link } from '@/components/Link'
import { FormSelect } from '@/components/settings/FormSelect'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { foundMatchCount, getFeatureEvent } from '@/data/feature-events'
import { features } from '@/data/mock'
import {
  getCampaignContent,
  isEditableStatus,
  useCampaigns,
} from '@/lib/campaign-store'
import {
  ignoreFeature,
  restoreFeature,
  useIgnoredFeatureIds,
} from '@/lib/feature-store'
import { featureHref } from '@/lib/navigate'
import { formatNumber } from '@/lib/format'
import { getSavedSettings } from '@/lib/settings-store'
import { toast } from 'sonner'

const VISIBILITY_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'ignored', label: 'Ignored' },
  { value: 'all', label: 'All' },
] as const

type Visibility = (typeof VISIBILITY_OPTIONS)[number]['value']

export default function FeaturesPage() {
  const campaigns = useCampaigns()
  const ignoredIds = useIgnoredFeatureIds()
  const ignored = useMemo(() => new Set(ignoredIds), [ignoredIds])
  const [visibility, setVisibility] = useState<Visibility>('active')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const globalThreshold = getSavedSettings().matching.minMatchStrength

  const rows = features.filter((feature) => {
    const isIgnored = ignored.has(feature.id)
    if (visibility === 'active') return !isIgnored
    if (visibility === 'ignored') return isIgnored
    return true
  })

  const pending = pendingId ? getFeatureEvent(pendingId) : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Feature events
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generated features, who they match, and the campaign draft for each.
          </p>
        </div>
        <FormSelect
          id="feature-visibility"
          value={visibility}
          options={VISIBILITY_OPTIONS}
          onValueChange={(value) => setVisibility(value as Visibility)}
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {visibility === 'ignored'
            ? 'No ignored feature events.'
            : 'No feature events in the queue.'}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Feature</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Topics and keywords</TableHead>
              <TableHead className="text-right">Matches</TableHead>
              <TableHead>Campaign</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((item) => {
              const feature = getFeatureEvent(item.id)
              if (!feature) return null
              const campaign = campaigns.find(
                (entry) => entry.featureId === feature.id
              )
              const content = campaign ? getCampaignContent(campaign.id) : null
              const matches = foundMatchCount(campaign, content, globalThreshold)
              const isIgnored = ignored.has(feature.id)

              return (
                <TableRow key={feature.id}>
                  <TableCell className="align-top font-medium whitespace-normal">
                    <Link
                      href={featureHref(feature.id)}
                      className="underline-offset-4 hover:underline"
                    >
                      {feature.title}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-sm align-top whitespace-normal">
                    <Link
                      href={featureHref(feature.id)}
                      className="line-clamp-2 text-muted-foreground hover:text-foreground"
                    >
                      {feature.description}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs align-top whitespace-normal">
                    <div className="flex flex-wrap gap-1">
                      {feature.topics.map((topic) => (
                        <Badge key={topic} variant="secondary">
                          {topic}
                        </Badge>
                      ))}
                      {feature.keywords.map((keyword) => (
                        <Badge key={keyword} variant="outline">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-right tabular-nums">
                    {formatNumber(matches)}
                  </TableCell>
                  <TableCell className="align-top">
                    {campaign ? (
                      <CampaignStatusBadge
                        status={campaign.status === 'sent' ? 'sent' : 'draft'}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="flex justify-end gap-2">
                      {campaign && isEditableStatus(campaign.status) ? (
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'xs',
                          })}
                        >
                          Edit draft
                        </Link>
                      ) : campaign ? (
                        <Link
                          href={`/campaigns/${campaign.id}`}
                          className={buttonVariants({
                            variant: 'outline',
                            size: 'xs',
                          })}
                        >
                          View campaign
                        </Link>
                      ) : null}
                      {isIgnored ? (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            restoreFeature(feature.id)
                            toast.success('Feature event restored')
                          }}
                        >
                          Restore
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setPendingId(feature.id)}
                        >
                          Ignore
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}

      <IgnoreFeatureDialog
        open={Boolean(pending)}
        title={pending?.title ?? ''}
        onCancel={() => setPendingId(null)}
        onConfirm={() => {
          if (!pendingId) return
          ignoreFeature(pendingId)
          setPendingId(null)
          toast.success('Feature event ignored')
        }}
      />
    </div>
  )
}
