import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  clampPercent,
  type CampaignContent,
} from '@/data/campaign-review'
import { formatNumber, formatPercent } from '@/lib/format'

type ConfidenceThresholdProps = {
  content: CampaignContent
  globalThreshold: number
  savedCount: number
  draftCount: number
  readOnly: boolean
  onChange: (patch: Partial<CampaignContent>) => void
}

export function ConfidenceThreshold({
  content,
  globalThreshold,
  savedCount,
  draftCount,
  readOnly,
  onChange,
}: ConfidenceThresholdProps) {
  const usingGlobal = content.useGlobalThreshold
  const value = usingGlobal ? globalThreshold : content.localThreshold
  const showImpact = savedCount !== draftCount

  function setLocal(next: number) {
    onChange({
      useGlobalThreshold: false,
      localThreshold: clampPercent(next),
    })
  }

  return (
    <section className="flex flex-col gap-5">
      <div>
        <h2 className="font-heading text-lg font-medium">
          Local confidence threshold
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Overrides the global matching default for this campaign only. Manual
          include and exclude still win over the threshold.
        </p>
      </div>

      <Label className="w-fit font-normal">
        <Checkbox
          checked={usingGlobal}
          disabled={readOnly}
          onCheckedChange={(checked) =>
            onChange({ useGlobalThreshold: checked === true })
          }
        />
        Use global default ({formatPercent(globalThreshold)})
      </Label>

      <Field>
        <div className="flex items-center gap-3">
          <span className="w-10 text-sm text-muted-foreground">Low</span>
          <Slider
            className="flex-1"
            min={0}
            max={100}
            step={1}
            disabled={readOnly || usingGlobal}
            value={[value]}
            onValueChange={(values) =>
              setLocal(Array.isArray(values) ? (values[0] ?? value) : values)
            }
            aria-label="Campaign confidence threshold"
          />
          <span className="w-10 text-right text-sm text-muted-foreground">
            High
          </span>
          <Input
            id="campaign-threshold"
            type="number"
            min={0}
            max={100}
            inputMode="numeric"
            disabled={readOnly || usingGlobal}
            aria-label="Campaign confidence threshold percent"
            className="w-20 text-center tabular-nums"
            value={value}
            onChange={(event) => setLocal(Number(event.target.value))}
          />
        </div>
        <FieldLabel className="sr-only" htmlFor="campaign-threshold">
          Confidence threshold
        </FieldLabel>
        <FieldDescription>
          Recipients at or above {formatPercent(value)} are included unless you
          exclude them manually.
        </FieldDescription>
      </Field>

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2 text-sm">
        <p>
          <span className="text-muted-foreground">Recipients now</span>
          <span className="ml-2 font-heading text-2xl font-medium tabular-nums">
            {formatNumber(draftCount)}
          </span>
        </p>
        {showImpact ? (
          <p className="text-muted-foreground">
            Before: {formatNumber(savedCount)} recipients → After:{' '}
            {formatNumber(draftCount)} recipients
          </p>
        ) : null}
      </div>
    </section>
  )
}
