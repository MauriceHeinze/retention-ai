import { FormSelect } from '@/components/settings/FormSelect'
import { IntegrationSummary } from '@/components/settings/IntegrationSummary'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { stripeDataSources } from '@/data/settings'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

export default function StripeSettingsPage() {
  const settings = useDraftSettings()
  const stripe = settings.stripe
  const disabled = stripe.status === 'not_connected'

  return (
    <div className="flex flex-col gap-8">
      <IntegrationSummary
        id="stripe"
        status={stripe.status}
        account={stripe.account}

      />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="stripe-source">Data source</FieldLabel>
          <FormSelect
            id="stripe-source"
            value={stripe.dataSource}
            options={stripeDataSources}
            disabled={disabled}
            onValueChange={(dataSource) =>
              updateDraftSettings('stripe', { ...stripe, dataSource })
            }
          />
          <FieldDescription>
            Choose which Stripe objects are used to identify former customers.
          </FieldDescription>
        </Field>
      </FieldGroup>
    </div>
  )
}
