import { FormSelect } from '@/components/settings/FormSelect'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'
import {
  BRAND_VOICE_MAX_WORDS,
  clampWordCount,
  countWords,
  languageOptions,
  type DefaultLanguage,
} from '@/data/settings'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

function previewCopy(language: DefaultLanguage, brandVoice: string) {
  const german = language === 'de'
  const voiceNote = brandVoice.trim()
    ? german
      ? `Tonfall: ${brandVoice.trim().slice(0, 140)}`
      : `Voice: ${brandVoice.trim().slice(0, 140)}`
    : german
      ? 'Tonfall: klar, direkt, ohne Übertreibung.'
      : 'Voice: clear, direct, no exaggeration.'

  if (german) {
    return {
      subject: 'SSO / SAML ist jetzt verfügbar',
      body: `Hallo Anna,\n\ndu hattest nach SSO gefragt. Es ist jetzt live und in wenigen Minuten eingerichtet.\n\n${voiceNote}`,
    }
  }

  return {
    subject: 'SSO / SAML is now available',
    body: `Hi Anna,\n\nyou asked about SSO. It is live now, and setup takes a few minutes.\n\n${voiceNote}`,
  }
}

export default function LanguageAndVoicePage() {
  const settings = useDraftSettings()
  const language = settings.language
  const wordCount = countWords(language.brandVoice)
  const preview = previewCopy(language.defaultLanguage, language.brandVoice)

  function handleVoiceChange(value: string) {
    updateDraftSettings('language', {
      ...language,
      brandVoice: clampWordCount(value, BRAND_VOICE_MAX_WORDS),
    })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Language & Voice
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          These settings control how campaign emails are written.
        </p>
      </div>

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="default-language">Default language</FieldLabel>
          <FormSelect
            id="default-language"
            value={language.defaultLanguage}
            options={languageOptions}
            onValueChange={(value) => {
              updateDraftSettings('language', {
                ...language,
                defaultLanguage: value as DefaultLanguage,
              })
            }}
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="brand-voice">Brand Voice</FieldLabel>
          <Textarea
            id="brand-voice"
            rows={10}
            className="min-h-64"
            placeholder="Describe how your company communicates. Include tone, preferred wording and phrases to avoid."
            value={language.brandVoice}
            onChange={(event) => handleVoiceChange(event.target.value)}
          />
          <FieldDescription>
            {wordCount.toLocaleString('en-GB')} / {BRAND_VOICE_MAX_WORDS.toLocaleString('en-GB')} words
          </FieldDescription>
        </Field>

        <div className="max-w-xl border bg-card p-5 text-sm">
          <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Sample email
          </p>
          <p className="mt-3 font-medium">{preview.subject}</p>
          <p className="mt-3 whitespace-pre-wrap text-muted-foreground">
            {preview.body}
          </p>
        </div>
      </FieldGroup>
    </div>
  )
}
