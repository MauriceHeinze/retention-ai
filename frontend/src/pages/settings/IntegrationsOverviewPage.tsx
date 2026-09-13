import { IntegrationMark } from '@/components/settings/IntegrationMark'
import { IntegrationStatusBadge } from '@/components/settings/IntegrationStatus'
import { formatLastSync } from '@/lib/format'
import { Link } from '@/components/Link'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  getIntegrationAccount,
  getIntegrationLastSync,
  getIntegrationStatus,
  integrationMeta,
  type IntegrationId,
} from '@/data/settings'
import { useDraftSettings } from '@/lib/settings-store'

const INTEGRATIONS: IntegrationId[] = ['stripe', 'github', 'mailchimp', 'slack']

export default function IntegrationsOverviewPage() {
  const settings = useDraftSettings()

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Integrations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Connect the tools used to find former customers and send campaigns.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {INTEGRATIONS.map((id) => {
          const meta = integrationMeta[id]
          const status = getIntegrationStatus(settings, id)
          const account = getIntegrationAccount(settings, id)
          const lastSync = getIntegrationLastSync(settings, id)
          const action = status === 'not_connected' ? 'Connect' : 'Manage'

          return (
            <Card key={id} size="sm">
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <IntegrationMark id={id} />
                  <div>
                    <p className="font-heading text-base font-medium">{meta.name}</p>
                    <div className="mt-1">
                      <IntegrationStatusBadge status={status} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-8">
                  <Link
                    href={meta.href}
                    className={buttonVariants({
                      size: 'sm',
                      variant: action === 'Connect' ? 'default' : 'outline',
                    })}
                  >
                    {action}
                  </Link>
                  <div className="text-right">
                    <p className="text-xs tracking-[0.08em] text-muted-foreground uppercase">
                      Last sync
                    </p>
                    <p className="mt-1 text-sm">{formatLastSync(lastSync)}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="mt-8 text-xs tracking-[0.08em] text-muted-foreground uppercase">
                  Connected account
                </p>
                <p className="mt-1 text-sm">{account ?? '—'}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
