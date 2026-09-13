import { useRef, useState } from 'react'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { errorMessage, sendDraft, type Decision, type Run } from '@/lib/backend'

export function DraftReview({ run, decision, onSent }: { run: Run; decision: Decision; onSent: () => Promise<unknown> }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [hasAccepted, setHasAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isInFlight = useRef(false)
  const delivery = run.deliveries?.[decision.customerId]
  const isAccepted = hasAccepted || delivery?.status === 'accepted'
  const [isExpired] = useState(() => !run.createdAt || Date.now() - Date.parse(run.createdAt) >= 23 * 60 * 60 * 1000)
  async function handleSend() {
    if (isInFlight.current || isAccepted) return
    isInFlight.current = true
    setIsSending(true)
    setError(null)
    try {
      const result = await sendDraft(run.id, decision.customerId)
      if (result.status !== 'accepted') throw new Error(result.error || 'The email was not accepted. Please try again.')
      setHasAccepted(true)
      setIsOpen(false)
      await onSent().catch(() => {})
    } catch (error) { setError(errorMessage(error)) }
    finally { isInFlight.current = false; setIsSending(false) }
  }
  if (!decision.draft) return null
  return (
    <Card>
      <CardHeader className="border-b"><CardTitle className="flex flex-wrap items-center gap-2"><Mail className="size-4" />Personal email draft<Badge variant="secondary">Customer {decision.customerId.slice(-6)}</Badge></CardTitle></CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div><p className="text-xs text-muted-foreground">Subject</p><h3 className="mt-2 font-medium">{decision.draft.subject}</h3></div>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{decision.draft.body}</p>
        {isAccepted ? <p role="status" className="text-sm font-medium">Accepted by Resend. Check the test inbox to confirm delivery.</p> : null}
        {isExpired ? <p className="text-sm text-muted-foreground">This review has expired for sending. Start a new analysis.</p> : null}
        {error && !isOpen ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
        <Button className="self-start" disabled={isAccepted || isSending || isExpired} onClick={() => setIsOpen(true)}>{isAccepted ? 'Accepted by Resend' : isSending ? 'Sending to test inbox...' : 'Approve and send test email'}</Button>
      </CardContent>
      <AlertDialog open={isOpen} onOpenChange={open => { if (!isSending) setIsOpen(open) }}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Send this approved draft?</AlertDialogTitle><AlertDialogDescription>Send one test email to your team's test inbox through Resend. The customer will not receive it.</AlertDialogDescription></AlertDialogHeader>
          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <AlertDialogFooter><AlertDialogCancel disabled={isSending}>Cancel</AlertDialogCancel><AlertDialogAction disabled={isSending} onClick={handleSend}>{isSending ? 'Sending...' : 'Confirm send'}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
