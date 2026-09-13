import { FormSelect } from '@/components/settings/FormSelect'
import { IntegrationSummary } from '@/components/settings/IntegrationSummary'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { slackChannels, slackPeople } from '@/data/settings'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

export default function SlackSettingsPage() {
  const settings = useDraftSettings()
  const slack = settings.slack
  const disabled = slack.status === 'not_connected'

  function toggleOwner(owner: string, checked: boolean) {
    const owners = checked
      ? [...slack.owners, owner]
      : slack.owners.filter((item) => item !== owner)

    updateDraftSettings('slack', { ...slack, owners })
  }

  return (
    <div className="flex flex-col gap-8">
      <IntegrationSummary
        id="slack"
        status={slack.status}
        account={slack.account}

      />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="slack-channel">Channel</FieldLabel>
          <FormSelect
            id="slack-channel"
            value={slack.channel}
            options={slackChannels}
            disabled={disabled}
            onValueChange={(channel) =>
              updateDraftSettings('slack', { ...slack, channel })
            }
          />
          <FieldDescription>
            Review requests and send alerts are posted here.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Responsible people</FieldLabel>
          <div className="flex flex-col gap-2">
            {slackPeople.map((person) => (
              <Label key={person.value} className="w-fit font-normal">
                <Checkbox
                  checked={slack.owners.includes(person.value)}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    toggleOwner(person.value, checked === true)
                  }
                />
                {person.label}
              </Label>
            ))}
          </div>
        </Field>
      </FieldGroup>
    </div>
  )
}
