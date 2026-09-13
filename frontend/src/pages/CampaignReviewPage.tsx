import { useEffect, useState } from 'react'
import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { Link } from '@/components/Link'
import { CampaignActions } from '@/components/campaign/CampaignActions'
import { ConfidenceThreshold } from '@/components/campaign/ConfidenceThreshold'
import { EmailPreview } from '@/components/campaign/EmailPreview'
import { RecipientTable } from '@/components/campaign/RecipientTable'
import { UnsavedChangesDialog } from '@/components/settings/UnsavedChangesDialog'
import {
  countIncluded,
  recipientsForCampaign,
  type CampaignContent,
} from '@/data/campaign-review'
import { featuresById } from '@/data/mock'
import {
  approveCampaign,
  getCampaignContent,
  isEditableStatus,
  rejectCampaign,
  saveCampaignContent,
  sendCampaign,
  useCampaign,
  useCampaignContent,
  useCampaignMeta,
} from '@/lib/campaign-store'
import { navigateUnchecked, setNavigationGuard } from '@/lib/navigate'
import { getSavedSettings } from '@/lib/settings-store'
import { toast } from 'sonner'

export default function CampaignReviewPage({ campaignId }: { campaignId: string }) {
  const campaign = useCampaign(campaignId)
  const savedContent = useCampaignContent(campaignId)
  const meta = useCampaignMeta(campaignId)
  const [draftId, setDraftId] = useState(campaignId)
  const [draft, setDraft] = useState<CampaignContent | null>(() =>
    getCampaignContent(campaignId)
  )
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  if (draftId !== campaignId) {
    setDraftId(campaignId)
    setDraft(getCampaignContent(campaignId))
  }

  const dirty =
    Boolean(draft && savedContent) &&
    JSON.stringify(draft) !== JSON.stringify(savedContent)

  useEffect(() => {
    setNavigationGuard((to) => {
      if (!dirty) return true
      setPendingHref(to)
      return false
    })
    return () => setNavigationGuard(null)
  }, [dirty])

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  if (!campaign || !savedContent) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Campaign not found
        </h1>
        <p className="text-sm text-muted-foreground">This campaign does not exist.</p>
        <Link href="/campaigns" className="text-sm text-primary hover:underline">
          Back to campaigns
        </Link>
      </div>
    )
  }

  if (!draft) return null

  const active = campaign
  const content = draft
  const feature = featuresById.get(active.featureId)
  const readOnly = !isEditableStatus(active.status)
  const globalThreshold = getSavedSettings().matching.minMatchStrength
  const recipients = recipientsForCampaign(active.id, active.featureId)
  const draftCount = countIncluded(recipients, content, globalThreshold)
  const savedCount = countIncluded(recipients, savedContent, globalThreshold)

  function patch(next: Partial<CampaignContent>) {
    setDraft((current) => (current ? { ...current, ...next } : current))
  }

  function handleSave() {
    saveCampaignContent(active.id, content)
    toast.success('Campaign saved')
  }

  function handleApprove() {
    approveCampaign(active.id, content)
    toast.success('Approved. Mailchimp draft is ready to send.')
  }

  function handleReject(reason: string) {
    rejectCampaign(active.id, reason, content)
    toast.success('Campaign rejected')
  }

  function handleSend() {
    if (dirty) saveCampaignContent(active.id, content)
    sendCampaign(active.id)
    toast.success('Campaign sent')
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <div className="flex flex-col gap-10 pb-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            <Link href="/campaigns" className="hover:underline">
              Campaigns
            </Link>
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-heading text-2xl font-medium tracking-tight">
              {active.name}
            </h1>
            <CampaignStatusBadge status={active.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {feature ? (
              <>
                Feature:{' '}
                <Link
                  href={`/features/${feature.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {feature.title}
                </Link>
                {' · '}
              </>
            ) : null}
            Audience: {active.audience}
          </p>
          {active.status === 'rejected' && meta.rejectReason ? (
            <p className="text-sm text-destructive">
              Rejected: {meta.rejectReason}
            </p>
          ) : null}
        </header>

        <EmailPreview
          featureTitle={feature?.title ?? active.name}
          content={content}
          readOnly={readOnly}
          onChange={patch}
        />

        <ConfidenceThreshold
          content={content}
          globalThreshold={globalThreshold}
          savedCount={savedCount}
          draftCount={draftCount}
          readOnly={readOnly}
          onChange={patch}
        />

        <RecipientTable
          recipients={recipients}
          content={content}
          globalThreshold={globalThreshold}
          readOnly={readOnly}
          onChange={patch}
        />
      </div>

      <CampaignActions
        status={active.status}
        dirty={dirty}
        recipientCount={draftCount}
        mailchimpId={meta.mailchimpId}
        onSave={handleSave}
        onReject={handleReject}
        onApprove={handleApprove}
        onSend={handleSend}
      />

      <UnsavedChangesDialog
        open={Boolean(pendingHref)}
        onStay={() => setPendingHref(null)}
        onDiscard={() => {
          const href = pendingHref
          setDraft(savedContent)
          setPendingHref(null)
          if (href) navigateUnchecked(href)
        }}
      />
    </div>
  )
}
