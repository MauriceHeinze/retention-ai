import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Slider } from '@/components/ui/slider'
import { updateDraftSettings, useDraftSettings } from '@/lib/settings-store'

function clampPercent(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.min(100, Math.max(0, Math.round(value)))
}

export default function MatchingPage() {
  const settings = useDraftSettings()
  const value = settings.matching.minMatchStrength

  function setValue(next: number) {
    updateDraftSettings('matching', { minMatchStrength: clampPercent(next) })
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Matching</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Control how strictly former customers must match a feature before they
          are included.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Minimum match strength</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>More recipients</span>
            <span>Higher relevance</span>
          </div>

          <Field>
            <div className="flex items-center gap-3">
              <span className="w-10 text-sm text-muted-foreground">Low</span>
              <Slider
                className="flex-1"
                min={0}
                max={100}
                step={1}
                value={[value]}
                onValueChange={(values) =>
                  setValue(Array.isArray(values) ? (values[0] ?? value) : values)
                }
                aria-label="Minimum match strength"
              />
              <span className="w-10 text-right text-sm text-muted-foreground">
                High
              </span>
              <Input
                id="match-strength"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                aria-label="Minimum match strength percent"
                className="w-20 text-center tabular-nums"
                value={value}
                onChange={(event) => setValue(Number(event.target.value))}
              />
            </div>
            <FieldLabel className="sr-only" htmlFor="match-strength">
              Minimum match strength
            </FieldLabel>
            <FieldDescription>
              Matches below this value are excluded by default. This can be changed
              for individual campaigns. We recommend a confidence score of at least
              65% to keep emails relevant.
            </FieldDescription>
          </Field>
        </CardContent>
      </Card>
    </div>
  )
}
