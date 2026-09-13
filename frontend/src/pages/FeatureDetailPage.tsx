import { useState } from 'react'
import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { FeatureAudience } from '@/components/feature/FeatureAudience'
import { FeatureDraft } from '@/components/feature/FeatureDraft'
import { FeatureSource } from '@/components/feature/FeatureSource'
import { IgnoreFeatureDialog } from '@/components/feature/IgnoreFeatureDialog'
import { Link } from '@/components/Link'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  recipientsForCampaign,
  type CampaignContent,
} from '@/data/campaign-review'
import { getFeatureEvent } from '@/data/feature-events'
import {
  getCampaignContent,
  isEditableStatus,
  saveCampaignContent,
  useCampaigns,
} from '@/lib/campaign-store'
import {
  ignoreFeature,
  isFeatureIgnored,
  restoreFeature,
  useIgnoredFeatureIds,
} from '@/lib/feature-store'
import {
  featureHref,
  navigate,
  type FeatureTab,
} from '@/lib/navigate'
import { getSavedSettings } from '@/lib/settings-store'
import { toast } from 'sonner'

type FeatureDetailPageProps = {
  featureId: string
  tab: FeatureTab
}

export default function FeatureDetailPage({
  featureId,
  tab,
}: FeatureDetailPageProps) {
  const campaigns = useCampaigns()
  useIgnoredFeatureIds()
  const feature = getFeatureEvent(featureId)
  const [ignoreOpen, setIgnoreOpen] = useState(false)

  if (!feature) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Feature event not found
        </h1>
        <p className="text-sm text-muted-foreground">
          This feature event does not exist.
        </p>
        <Link href="/features" className="text-sm text-primary hover:underline">
          Back to feature events
        </Link>
      </div>
    )
  }

  const campaign = campaigns.find((item) => item.featureId === feature.id)
  const content = campaign ? getCampaignContent(campaign.id) : null
  const ignored = isFeatureIgnored(feature.id)
  const readOnly = !campaign || !isEditableStatus(campaign.status)
  const globalThreshold = getSavedSettings().matching.minMatchStrength
  const recipients = campaign
    ? recipientsForCampaign(campaign.id, campaign.featureId)
    : []

  function handleIgnore() {
    ignoreFeature(featureId)
    setIgnoreOpen(false)
    toast.success('Feature event ignored')
    navigate('/features')
  }

  function handleAudienceChange(patch: Partial<CampaignContent>) {
    if (!campaign || !content) return
    saveCampaignContent(campaign.id, { ...content, ...patch })
  }

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/features" className="hover:underline">
              Feature events
            </Link>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-medium tracking-tight">
              {feature.title}
            </h1>
            {campaign ? <CampaignStatusBadge status={campaign.status} /> : null}
            {ignored ? (
              <span className="text-xs font-medium text-muted-foreground">
                Ignored
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap justify-end gap-2">
          {campaign && isEditableStatus(campaign.status) ? (
            <Link
              href={`/campaigns/${campaign.id}`}
              className={buttonVariants({ size: 'sm' })}
            >
              Edit draft
            </Link>
          ) : campaign ? (
            <Link
              href={`/campaigns/${campaign.id}`}
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              View campaign
            </Link>
          ) : null}
          {ignored ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                restoreFeature(feature.id)
                toast.success('Feature event restored')
              }}
            >
              Restore
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIgnoreOpen(true)}
            >
              Ignore
            </Button>
          )}
        </div>
      </header>

      <Tabs
        value={tab}
        onValueChange={(value) => {
          if (value === 'feature' || value === 'matches' || value === 'draft') {
            navigate(featureHref(feature.id, value))
          }
        }}
      >
        <TabsList variant="line">
          <TabsTrigger value="feature">Feature</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
        </TabsList>
        <TabsContent value="feature" className="pt-6">
          <FeatureSource feature={feature} />
        </TabsContent>
        <TabsContent value="matches" className="pt-6">
          {content && campaign ? (
            <FeatureAudience
              recipients={recipients}
              content={content}
              globalThreshold={globalThreshold}
              readOnly={readOnly}
              onChange={handleAudienceChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No matches yet for this feature.
            </p>
          )}
        </TabsContent>
        <TabsContent value="draft" className="pt-6">
          <FeatureDraft
            featureTitle={feature.title}
            campaignId={campaign?.id ?? null}
            content={content}
            sent={campaign?.status === 'sent'}
          />
        </TabsContent>
      </Tabs>

      <IgnoreFeatureDialog
        open={ignoreOpen}
        title={feature.title}
        onCancel={() => setIgnoreOpen(false)}
        onConfirm={handleIgnore}
      />
    </div>
  )
}
