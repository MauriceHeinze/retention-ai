import { IntegrationMark } from '@/components/settings/IntegrationMark'
import {
  ComingSoonBadge,
  IntegrationStatusBadge,
} from '@/components/settings/IntegrationStatus'
import { Button } from '@/components/ui/button'
import type { IntegrationId, IntegrationStatus } from '@/data/settings'
import { integrationMeta } from '@/data/settings'
import { connectIntegration, disconnectIntegration } from '@/lib/settings-store'

type IntegrationSummaryProps = {
  id: IntegrationId
  status: IntegrationStatus
  account: string | null
  errorMessage?: string | null
}

export function IntegrationSummary({
  id,
  status,
  account,
  errorMessage,
}: IntegrationSummaryProps) {
  const meta = integrationMeta[id]
  const connected = status !== 'not_connected'

  return (
    <div className={meta.available ? 'flex flex-col gap-8' : 'flex flex-col gap-8 opacity-60'}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <IntegrationMark id={id} muted={!meta.available} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-medium tracking-tight">
                {meta.name}
              </h1>
              {meta.available ? (
                <IntegrationStatusBadge status={status} />
              ) : (
                <ComingSoonBadge />
              )}
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        {meta.available ? (
          connected ? (
            <Button variant="outline" onClick={() => disconnectIntegration(id)}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => connectIntegration(id)}>Connect</Button>
          )
        ) : null}
      </div>

      <dl>
        <div>
          <dt className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Connected account
          </dt>
          <dd className="mt-1 text-sm">{meta.available ? (account ?? '—') : '—'}</dd>
        </div>
      </dl>

      {meta.available && status === 'error' && errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
