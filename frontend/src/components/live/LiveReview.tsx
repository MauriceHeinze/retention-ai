import { Link } from '@/components/Link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DraftReview } from '@/components/live/DraftReview'
import { errorMessage, useRun, type Run } from '@/lib/backend'

export function LiveReview({ runId }: { runId: string }) {
  const { data: run, error, isLoading, mutate } = useRun(runId)
  const decisions = run?.result?.assessment.decisions ?? []
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <Link href="/campaigns" className="text-sm text-primary hover:underline">Back to campaigns</Link>
      <header><h1 className="font-heading text-2xl font-medium">Release review</h1><p className="mt-2 text-sm text-muted-foreground">Evidence first. Personal outreach only after your approval.</p></header>
      {isLoading ? <p role="status">Loading release review...</p> : null}
      {error ? <div role="alert" className="flex flex-col items-start gap-3"><p className="text-sm text-destructive">{errorMessage(error)}</p><Button variant="outline" onClick={() => void mutate()}>Retry loading review</Button></div> : null}
      {run?.status === 'running' ? <p role="status" className="rounded border p-6 text-sm">The agent is reading release evidence and cancellation feedback. This usually takes 30-60 seconds. This page updates automatically.</p> : null}
      {run?.status === 'failed' ? <p role="alert" className="text-sm text-destructive">{run.error || 'Analysis failed. Return to the dashboard to try again.'}</p> : null}
      {run?.status === 'completed' && run.result ? <>
        <div className="flex flex-wrap gap-2"><Badge variant="secondary">{run.sources?.release === 'github' ? 'GitHub' : 'Sample release'}</Badge><Badge variant="secondary">{run.sources?.customers === 'stripe_sandbox' ? 'Stripe' : 'Sample customers'}</Badge><Badge variant="secondary">AI assessment</Badge></div>
        <ReleaseEvidence run={run} />
        <CustomerDecisions run={run} />
        <section className="flex flex-col gap-4" aria-label="Email drafts">
          {decisions.filter(item => item.decision === 'match' && item.draft).map(decision => <DraftReview key={`${run.id}:${decision.customerId}`} run={run} decision={decision} onSent={() => mutate()} />)}
          {!decisions.some(item => item.decision === 'match') ? <p className="text-sm text-muted-foreground">No confirmed matches. No email drafts were created for this release.</p> : null}
        </section>
      </> : null}
    </div>
  )
}

export function ReleaseEvidence({ run }: { run: Run }) {
  return <Card><CardHeader><CardTitle>What shipped</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">
    <p className="break-all text-xs text-muted-foreground">{run.release?.id}</p>
    <details><summary className="cursor-pointer text-sm font-medium">View verified release evidence</summary><pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words bg-muted p-4 text-xs">{run.release?.evidence}</pre></details>
    <p className="text-xs text-muted-foreground">Review the release evidence before approving outreach.</p>
  </CardContent></Card>
}

const LABELS = { match: 'Match', no_match: 'No match', needs_review: 'Needs review' } as const
export function CustomerDecisions({ run }: { run: Run }) {
  const decisions = run.result?.assessment.decisions ?? []
  const byCustomer = new Map(decisions.map(item => [item.customerId, item]))
  return <Card><CardHeader><CardTitle>Customer decisions</CardTitle><p className="text-sm text-muted-foreground">{decisions.filter(item => item.decision === 'match').length} matched, {run.result?.excludedCustomers} excluded from outreach.</p></CardHeader><CardContent className="px-0">
    <Table><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Cancellation feedback</TableHead><TableHead>Decision and evidence</TableHead></TableRow></TableHeader><TableBody>
      {run.customers?.map(customer => {
        const decision = byCustomer.get(customer.id)
        return <TableRow key={customer.id}>
          <TableCell className="align-top font-mono text-xs">{customer.id.slice(-6)}</TableCell>
          <TableCell className="max-w-sm align-top whitespace-normal text-sm">{customer.feedback || 'No feedback provided'}</TableCell>
          <TableCell className="max-w-lg align-top whitespace-normal"><Badge variant={decision?.decision === 'match' ? 'default' : 'outline'}>{decision ? LABELS[decision.decision] : 'Excluded'}</Badge><p className="mt-2 text-sm text-muted-foreground">{decision?.reason || (customer.marketingConsent ? 'Not eligible for this outreach.' : 'No marketing consent. No draft created.')}</p>{decision ? <details className="mt-2 text-xs"><summary className="cursor-pointer">Source quotes</summary><p className="mt-2 whitespace-pre-wrap break-words">Customer: {decision.customerEvidence || 'No feedback'}<br />Release: {decision.releaseEvidence}</p></details> : null}</TableCell>
        </TableRow>
      })}
    </TableBody></Table>
  </CardContent></Card>
}
