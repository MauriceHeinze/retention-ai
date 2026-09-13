import { useState } from 'react'
import { Link } from '@/components/Link'
import { FormSelect } from '@/components/settings/FormSelect'
import { buttonVariants } from '@/components/ui/button'
import {
  renderCampaignEmail,
  type CampaignContent,
} from '@/data/campaign-review'
import { mailchimpTemplates } from '@/data/settings'
import { getSavedSettings } from '@/lib/settings-store'
import { cn } from '@/lib/utils'

type FeatureDraftProps = {
  featureTitle: string
  campaignId: string | null
  content: CampaignContent | null
  sent: boolean
}

export function FeatureDraft({
  featureTitle,
  campaignId,
  content,
  sent,
}: FeatureDraftProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const settings = getSavedSettings()
  const templateLabel =
    mailchimpTemplates.find((item) => item.value === settings.mailchimp.template)
      ?.label ?? settings.mailchimp.template

  if (!campaignId || !content) {
    return (
      <p className="text-sm text-muted-foreground">
        No campaign draft has been generated for this feature yet.
      </p>
    )
  }

  const html = renderCampaignEmail(settings.template.html, {
    feature_title: featureTitle,
    first_name: 'Anna',
    cta_url: 'https://acme.example/whats-new',
    body: content.body,
  })

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-medium">Draft preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {sent
              ? 'This campaign has been sent. Open the editor to see the final copy.'
              : `Company template: ${templateLabel}`}
          </p>
        </div>
        <Link
          href={`/campaigns/${campaignId}`}
          className={buttonVariants({ variant: sent ? 'outline' : 'default' })}
        >
          {sent ? 'View campaign' : 'Open campaign editor'}
        </Link>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium">Inbox preview</p>
        <FormSelect
          id="feature-draft-viewport"
          value={viewport}
          options={[
            { value: 'desktop', label: 'Desktop' },
            { value: 'mobile', label: 'Mobile' },
          ]}
          onValueChange={(value) => setViewport(value as 'desktop' | 'mobile')}
        />
      </div>

      <div className="border bg-muted/40 p-4">
        <div
          className={cn(
            'mx-auto overflow-hidden bg-white text-left shadow-sm ring-1 ring-foreground/10',
            viewport === 'mobile' ? 'max-w-[375px]' : 'max-w-[640px]'
          )}
        >
          <div className="border-b px-4 py-3 text-xs text-zinc-600">
            <p>
              <span className="text-zinc-400">From</span> {content.fromName}{' '}
              &lt;{content.fromEmail}&gt;
            </p>
            <p className="mt-1 font-medium text-zinc-900">{content.subject}</p>
            <p className="mt-1 text-zinc-500">{content.previewText}</p>
          </div>
          <iframe
            title={`${viewport} draft preview`}
            sandbox=""
            srcDoc={html}
            className={cn(
              'w-full bg-white',
              viewport === 'mobile' ? 'min-h-[28rem]' : 'min-h-[32rem]'
            )}
          />
        </div>
      </div>
    </section>
  )
}
