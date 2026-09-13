import { Link } from '@/components/Link'
import { buttonVariants } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CustomerDecisions, ReleaseEvidence } from '@/components/live/LiveReview'
import { DraftReview } from '@/components/live/DraftReview'
import { errorMessage, useRun } from '@/lib/backend'
import { releaseTitle } from '@/lib/live-data'
import { navigate } from '@/lib/navigate'

export function LiveFeatureDetail({ runId, tab }: { runId: string; tab: string }) {
  const { data: run, error, isLoading, mutate } = useRun(runId)
  return <div className="flex flex-col gap-8">
    <header className="flex flex-col items-start gap-3">
      <Link href="/features" className="text-sm text-muted-foreground hover:underline">Feature events</Link>
      <h1 className="font-heading text-2xl font-medium tracking-tight">{run ? releaseTitle(run) : 'Feature review'}</h1>
      <Link href={`/campaigns/live/${runId}`} className={buttonVariants({ size: 'sm' })}>Review campaign</Link>
    </header>
    {isLoading ? <p role="status">Loading feature evidence...</p> : null}
    {error ? <p role="alert" className="text-sm text-destructive">{errorMessage(error)}</p> : null}
    {run?.status === 'failed' ? <p role="alert">{run.error || 'Feature analysis failed.'}</p> : null}
    {run?.status === 'running' ? <p role="status">Analyzing this release. This page updates automatically.</p> : null}
    {run?.status === 'completed' ? <Tabs value={['feature', 'matches', 'draft'].includes(tab) ? tab : 'feature'} onValueChange={value => navigate(`/features/live/${runId}/${value}`)}>
      <TabsList variant="line"><TabsTrigger value="feature">Feature</TabsTrigger><TabsTrigger value="matches">Matches</TabsTrigger><TabsTrigger value="draft">Draft</TabsTrigger></TabsList>
      <TabsContent value="feature" className="pt-6"><ReleaseEvidence run={run} /></TabsContent>
      <TabsContent value="matches" className="pt-6"><CustomerDecisions run={run} /></TabsContent>
      <TabsContent value="draft" className="flex flex-col gap-6 pt-6">
        {run.result?.assessment.decisions.filter(item => item.decision === 'match' && item.draft).map(decision => <DraftReview key={decision.customerId} run={run} decision={decision} onSent={() => mutate()} />)}
        {!run.result?.assessment.decisions.some(item => item.decision === 'match') ? <p>No eligible matches. No draft was created.</p> : null}
      </TabsContent>
    </Tabs> : null}
  </div>
}
