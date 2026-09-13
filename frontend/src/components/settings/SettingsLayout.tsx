import { useEffect, useState, type ReactNode } from 'react'
import { SettingsNav } from '@/components/settings/SettingsNav'
import { SettingsSaveBar } from '@/components/settings/SettingsSaveBar'
import { UnsavedChangesDialog } from '@/components/settings/UnsavedChangesDialog'
import { isSettingsPath, navigateUnchecked, setNavigationGuard } from '@/lib/navigate'
import { discardSettings, useSettingsDirty } from '@/lib/settings-store'

type SettingsLayoutProps = {
  pathname: string
  children: ReactNode
}

export function SettingsLayout({ pathname, children }: SettingsLayoutProps) {
  const dirty = useSettingsDirty()
  const [pendingHref, setPendingHref] = useState<string | null>(null)

  useEffect(() => {
    setNavigationGuard((to) => {
      if (!dirty) return true
      if (isSettingsPath(to)) return true
      setPendingHref(to)
      return false
    })

    return () => setNavigationGuard(null)
  }, [dirty])

  useEffect(() => {
    function onBeforeUnload(event: BeforeUnloadEvent) {
      if (!dirty) return
      event.preventDefault()
      event.returnValue = ''
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [dirty])

  function handleStay() {
    setPendingHref(null)
  }

  function handleDiscardAndLeave() {
    const href = pendingHref
    discardSettings()
    setPendingHref(null)
    if (href) navigateUnchecked(href)
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-56 shrink-0 overflow-y-auto border-r px-3 py-6 md:block">
        <SettingsNav pathname={pathname} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8 md:hidden">
            <SettingsNav pathname={pathname} />
          </div>
          <div
            className={
              pathname === '/settings/template'
                ? 'mx-auto w-full max-w-6xl'
                : 'mx-auto w-full max-w-3xl'
            }
          >
            {children}
          </div>
        </div>
        {dirty ? <SettingsSaveBar /> : null}
      </div>

      <UnsavedChangesDialog
        open={Boolean(pendingHref)}
        onStay={handleStay}
        onDiscard={handleDiscardAndLeave}
      />
    </div>
  )
}
