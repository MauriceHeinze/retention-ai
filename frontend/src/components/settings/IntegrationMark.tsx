import type { IntegrationId } from '@/data/settings'
import { cn } from '@/lib/utils'

const MARK: Record<IntegrationId, { label: string; className: string }> = {
  stripe: { label: 'S', className: 'bg-[#635bff] text-white' },
  github: { label: 'G', className: 'bg-zinc-900 text-white' },
  mailchimp: { label: 'M', className: 'bg-[#ffe01b] text-zinc-900' },
  slack: { label: 'Sl', className: 'bg-[#4a154b] text-white' },
}

export function IntegrationMark({
  id,
  className,
}: {
  id: IntegrationId
  className?: string
}) {
  const mark = MARK[id]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-9 shrink-0 items-center justify-center text-sm font-medium',
        mark.className,
        className
      )}
    >
      {mark.label}
    </span>
  )
}
