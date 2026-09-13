import { useState } from 'react'
import { FormSelect } from '@/components/settings/FormSelect'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  renderCampaignEmail,
  type CampaignContent,
} from '@/data/campaign-review'
import { mailchimpTemplates } from '@/data/settings'
import { getSession } from '@/lib/auth'
import { getSavedSettings } from '@/lib/settings-store'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { TestEmailDialog } from '@/components/campaign/TestEmailDialog'

type EmailPreviewProps = {
  featureTitle: string
  content: CampaignContent
  readOnly: boolean
  onChange: (patch: Partial<CampaignContent>) => void
}

export function EmailPreview({
  featureTitle,
  content,
  readOnly,
  onChange,
}: EmailPreviewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop')
  const [testOpen, setTestOpen] = useState(false)
  const settings = getSavedSettings()
  const templateLabel =
    mailchimpTemplates.find((item) => item.value === settings.mailchimp.template)
      ?.label ?? settings.mailchimp.template
  const html = renderCampaignEmail(settings.template.html, {
    feature_title: featureTitle,
    first_name: 'Anna',
    cta_url: 'https://acme.example/whats-new',
    body: content.body,
  })

  function sendTest(email: string) {
    toast.success(`Test email sent to ${email}`)
    setTestOpen(false)
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-medium">Email preview</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Company template: {templateLabel}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setTestOpen(true)}
          disabled={readOnly}
        >
          Send test email
        </Button>
      </div>

      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="campaign-subject">Subject</FieldLabel>
          <Input
            id="campaign-subject"
            value={content.subject}
            disabled={readOnly}
            onChange={(event) => onChange({ subject: event.target.value })}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="campaign-preview">Preview text</FieldLabel>
          <Input
            id="campaign-preview"
            value={content.previewText}
            disabled={readOnly}
            onChange={(event) => onChange({ previewText: event.target.value })}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="campaign-from-name">Sender name</FieldLabel>
            <Input
              id="campaign-from-name"
              value={content.fromName}
              disabled={readOnly}
              onChange={(event) => onChange({ fromName: event.target.value })}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="campaign-from-email">Sender email</FieldLabel>
            <Input
              id="campaign-from-email"
              type="email"
              value={content.fromEmail}
              disabled={readOnly}
              onChange={(event) => onChange({ fromEmail: event.target.value })}
            />
          </Field>
        </div>
        <Field>
          <FieldLabel htmlFor="campaign-body">Email body</FieldLabel>
          <Textarea
            id="campaign-body"
            rows={6}
            value={content.body}
            disabled={readOnly}
            onChange={(event) => onChange({ body: event.target.value })}
          />
          <FieldDescription>
            {'Use {{first_name}} for personalization. Changes stay local until you save.'}
          </FieldDescription>
        </Field>
      </FieldGroup>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium">Inbox preview</p>
          <FormSelect
            id="preview-viewport"
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
              title={`${viewport} email preview`}
              sandbox=""
              srcDoc={html}
              className={cn(
                'w-full bg-white',
                viewport === 'mobile' ? 'min-h-[28rem]' : 'min-h-[32rem]'
              )}
            />
          </div>
        </div>
      </div>

      <TestEmailDialog
        key={testOpen ? 'open' : 'closed'}
        open={testOpen}
        defaultEmail={getSession() ?? ''}
        onOpenChange={setTestOpen}
        onSend={sendTest}
      />
    </section>
  )
}
