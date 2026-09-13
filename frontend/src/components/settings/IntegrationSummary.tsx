import { IntegrationMark } from '@/components/settings/IntegrationMark'
import { IntegrationStatusBadge } from '@/components/settings/IntegrationStatus'
import { Button } from '@/components/ui/button'
import type { IntegrationId, IntegrationStatus } from '@/data/settings'
import { integrationMeta } from '@/data/settings'
import { formatLastSync } from '@/lib/format'
import { connectIntegration, disconnectIntegration } from '@/lib/settings-store'

type IntegrationSummaryProps = {
  id: IntegrationId
  status: IntegrationStatus
  account: string | null
  lastSync: string | null
  errorMessage?: string | null
}

export function IntegrationSummary({
  id,
  status,
  account,
  lastSync,
  errorMessage,
}: IntegrationSummaryProps) {
  const meta = integrationMeta[id]
  const connected = status !== 'not_connected'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <IntegrationMark id={id} />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-medium tracking-tight">
                {meta.name}
              </h1>
              <IntegrationStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-8">
          {connected ? (
            <Button variant="outline" onClick={() => disconnectIntegration(id)}>
              Disconnect
            </Button>
          ) : (
            <Button onClick={() => connectIntegration(id)}>Connect</Button>
          )}
          <div className="text-right">
            <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
              Last sync
            </p>
            <p className="mt-1 text-sm">{formatLastSync(lastSync)}</p>
          </div>
        </div>
      </div>

      <dl>
        <div>
          <dt className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
            Connected account
          </dt>
          <dd className="mt-1 text-sm">{account ?? '—'}</dd>
        </div>
      </dl>

      {status === 'error' && errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  )
}
