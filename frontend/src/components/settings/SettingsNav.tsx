import { Link } from '@/components/Link'
import { IntegrationMark } from '@/components/settings/IntegrationMark'
import { IntegrationStatusDot } from '@/components/settings/IntegrationStatus'
import { integrationMeta, type IntegrationId } from '@/data/settings'
import { useDraftSettings } from '@/lib/settings-store'
import { cn } from '@/lib/utils'

const INTEGRATIONS: IntegrationId[] = ['stripe', 'github', 'mailchimp', 'slack']

const AI_ITEMS = [
  { href: '/settings/matching', label: 'Matching' },
  { href: '/settings/language-and-voice', label: 'Language & Voice' },
  { href: '/settings/template', label: 'Template' },
] as const

export function SettingsNav({ pathname }: { pathname: string }) {
  const settings = useDraftSettings()
  const integrationsActive =
    pathname === '/settings' || pathname.startsWith('/settings/integrations')

  return (
    <nav aria-label="Settings" className="flex flex-col gap-8">
      <div>
        <Link
          href="/settings/integrations"
          className={cn(
            'px-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase',
            integrationsActive && 'text-foreground'
          )}
        >
          Integrations
        </Link>
        <ul className="mt-2 flex flex-col gap-0.5">
          {INTEGRATIONS.map((id) => {
            const meta = integrationMeta[id]
            const isActive = pathname === meta.href
            const itemClass = cn(
              'flex items-center justify-between gap-3 px-2 py-1.5 text-sm',
              meta.available
                ? isActive
                  ? 'bg-muted font-medium text-foreground'
                  : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                : 'cursor-not-allowed text-muted-foreground/50'
            )

            return (
              <li key={id}>
                {meta.available ? (
                  <Link
                    href={meta.href}
                    aria-current={isActive ? 'page' : undefined}
                    className={itemClass}
                  >
                    <span className="flex items-center gap-2">
                      <IntegrationMark id={id} size="sm" />
                      {meta.name}
                    </span>
                    <IntegrationStatusDot status={settings[id].status} />
                  </Link>
                ) : (
                  <span className={itemClass} aria-disabled="true">
                    <span className="flex items-center gap-2">
                      <IntegrationMark id={id} size="sm" muted />
                      {meta.name}
                    </span>
                    <span className="text-[10px] tracking-[0.08em] uppercase">
                      Soon
                    </span>
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div>
        <p className="px-2 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase">
          AI Configuration
        </p>
        <ul className="mt-2 flex flex-col gap-0.5">
          {AI_ITEMS.map((item) => {
            const isActive = pathname === item.href

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'block px-2 py-1.5 text-sm',
                    isActive
                      ? 'bg-muted font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  )}
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
