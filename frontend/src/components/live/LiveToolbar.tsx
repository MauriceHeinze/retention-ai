import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { errorMessage, startDemo } from '@/lib/backend'
import { navigate } from '@/lib/navigate'

export function LiveToolbar({ isLoading, error, onRefresh }: { isLoading: boolean; error: unknown; onRefresh: () => Promise<unknown> }) {
  const [isStarting, setIsStarting] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  async function handleStart() {
    setIsStarting(true)
    setActionError(null)
    try { const run = await startDemo(); navigate(`/campaigns/live/${run.id}`) }
    catch (error) { setActionError(errorMessage(error)) }
    finally { setIsStarting(false) }
  }
  async function handleRefresh() {
    setIsRefreshing(true)
    try { await onRefresh() } catch (error) { setActionError(errorMessage(error)) }
    finally { setIsRefreshing(false) }
  }
  return <div className="flex flex-col gap-3">
    <div className="flex flex-wrap items-center justify-end gap-4">
      <div className="flex gap-2"><Button variant="outline" size="sm" disabled={isRefreshing || isLoading} onClick={handleRefresh}><RefreshCw className="size-4" />Refresh</Button><Button size="sm" disabled={isStarting} onClick={handleStart}>{isStarting ? 'Starting analysis...' : 'Run sample analysis'}</Button></div>
    </div>
    {isLoading ? <p role="status" className="text-sm text-muted-foreground">Loading deployment results...</p> : null}
    {error || actionError ? <p role="alert" className="text-sm text-destructive">{actionError || errorMessage(error)}</p> : null}
  </div>
}
