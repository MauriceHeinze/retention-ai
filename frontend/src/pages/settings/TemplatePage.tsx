import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

export default function TemplatePage() {
  const settings = useDraftSettings()
  const html = settings.template.html

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Template</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Edit the HTML used for campaign emails. Placeholders such as
          {' '}
          <code className="text-foreground">{"{{feature_title}}"}</code>
          {' '}
          stay in the markup.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Preview</p>
          <iframe
            title="Email template preview"
            sandbox=""
            srcDoc={html}
            className="min-h-[32rem] w-full bg-white ring-1 ring-foreground/10"
          />
        </div>

        <Field>
          <FieldLabel htmlFor="template-html">HTML</FieldLabel>
          <Textarea
            id="template-html"
            spellCheck={false}
            className="min-h-[32rem] font-mono text-xs leading-relaxed"
            value={html}
            onChange={(event) =>
              updateDraftSettings('template', { html: event.target.value })
            }
          />
          <FieldDescription>
            Changes stay local until you save. The preview updates as you type.
          </FieldDescription>
        </Field>
      </div>
    </div>
  )
}
