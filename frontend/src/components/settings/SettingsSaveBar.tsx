import { Button } from '@/components/ui/button'
import { discardSettings, saveSettings } from '@/lib/settings-store'
import { toast } from 'sonner'

export function SettingsSaveBar() {
  function handleSave() {
    saveSettings()
    toast.success('Settings saved')
  }

  return (
    <div className="border-t bg-background px-4 py-3 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={discardSettings}>
          Discard changes
        </Button>
        <Button onClick={handleSave}>Save changes</Button>
      </div>
    </div>
  )
}
