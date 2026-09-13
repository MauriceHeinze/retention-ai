import { FormSelect } from '@/components/settings/FormSelect'
import { IntegrationSummary } from '@/components/settings/IntegrationSummary'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Label } from '@/components/ui/label'
import { githubOrganizations, githubReposForOrg } from '@/data/settings'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

export default function GitHubSettingsPage() {
  const settings = useDraftSettings()
  const github = settings.github
  const disabled = github.status === 'not_connected'
  const repos = githubReposForOrg(github.organization)
  const orgOptions = githubOrganizations.map((org) => ({
    value: org.value,
    label: org.label,
  }))

  function handleOrgChange(organization: string) {
    updateDraftSettings('github', {
      ...github,
      organization,
      repositories: githubReposForOrg(organization).slice(0, 1),
    })
  }

  function toggleRepo(repo: string, checked: boolean) {
    const repositories = checked
      ? [...github.repositories, repo]
      : github.repositories.filter((item) => item !== repo)

    updateDraftSettings('github', { ...github, repositories })
  }

  return (
    <div className="flex flex-col gap-8">
      <IntegrationSummary
        id="github"
        status={github.status}
        account={github.account}
        lastSync={github.lastSync}
      />

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="github-org">Organization</FieldLabel>
          <FormSelect
            id="github-org"
            value={github.organization}
            options={orgOptions}
            disabled={disabled}
            onValueChange={handleOrgChange}
          />
          <FieldDescription>
            Features are collected from merged pull requests in this organization.
          </FieldDescription>
        </Field>

        <Field>
          <FieldLabel>Repositories</FieldLabel>
          <div className="flex flex-col gap-2">
            {repos.map((repo) => (
              <Label key={repo} className="w-fit font-normal">
                <Checkbox
                  checked={github.repositories.includes(repo)}
                  disabled={disabled}
                  onCheckedChange={(checked) => toggleRepo(repo, checked === true)}
                />
                {repo}
              </Label>
            ))}
          </div>
        </Field>
      </FieldGroup>
    </div>
  )
}
