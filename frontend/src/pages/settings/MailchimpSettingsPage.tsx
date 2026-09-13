import { FormSelect } from '@/components/settings/FormSelect'
import { IntegrationSummary } from '@/components/settings/IntegrationSummary'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { mailchimpAudiences, mailchimpTemplates } from '@/data/settings'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

export default function MailchimpSettingsPage() {
  const settings = useDraftSettings()
  const mailchimp = settings.mailchimp
  const disabled = true

  return (
    <div className="flex flex-col gap-8">
      <IntegrationSummary
        id="mailchimp"
        status={mailchimp.status}
        account={mailchimp.account}
        errorMessage={mailchimp.errorMessage}
      />

      <FieldGroup className="pointer-events-none opacity-60">
        <Field>
          <FieldLabel htmlFor="mailchimp-audience">Audience</FieldLabel>
          <FormSelect
            id="mailchimp-audience"
            value={mailchimp.audience}
            options={mailchimpAudiences}
            disabled={disabled}
            onValueChange={(audience) =>
              updateDraftSettings('mailchimp', { ...mailchimp, audience })
            }
          />
          <FieldDescription>
            Campaigns are sent to this Mailchimp audience.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel htmlFor="mailchimp-template">Template</FieldLabel>
          <FormSelect
            id="mailchimp-template"
            value={mailchimp.template}
            options={mailchimpTemplates}
            disabled={disabled}
            onValueChange={(template) =>
              updateDraftSettings('mailchimp', { ...mailchimp, template })
            }
          />
          <FieldDescription>
            The in-app email template can be edited under Template.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  )
}
