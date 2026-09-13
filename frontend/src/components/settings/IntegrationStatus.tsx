import { Badge } from '@/components/ui/badge'
import type { IntegrationStatus as Status } from '@/data/settings'
import { cn } from '@/lib/utils'

const LABEL: Record<Status, string> = {
  connected: 'Connected',
  error: 'Error',
  not_connected: 'Not connected',
}

export function IntegrationStatusBadge({ status }: { status: Status }) {
  if (status === 'connected') {
    return <Badge>{LABEL[status]}</Badge>
  }

  if (status === 'error') {
    return <Badge variant="destructive">{LABEL[status]}</Badge>
  }

  return <Badge variant="outline">{LABEL[status]}</Badge>
}

export function IntegrationStatusDot({
  status,
  className,
}: {
  status: Status
  className?: string
}) {
  if (status === 'error') {
    return (
      <span
        className={cn(
          'flex size-4 items-center justify-center text-[11px] font-semibold text-amber-600',
          className
        )}
        aria-label="Error"
      >
        !
      </span>
    )
  }

  return (
    <span
      className={cn(
        'size-2 rounded-full',
        status === 'connected' ? 'bg-emerald-500' : 'bg-transparent ring-1 ring-muted-foreground/50',
        className
      )}
      aria-label={LABEL[status]}
    />
  )
}
