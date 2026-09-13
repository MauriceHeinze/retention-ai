import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Textarea } from '@/components/ui/textarea'

type RejectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onReject: (reason: string) => void
}

export function RejectDialog({ open, onOpenChange, onReject }: RejectDialogProps) {
  const [reason, setReason] = useState('')

  function handleOpenChange(next: boolean) {
    if (next) setReason('')
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject campaign</AlertDialogTitle>
          <AlertDialogDescription>
            The campaign stays in the list as rejected. You can add an optional
            reason for the team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="reject-reason">Reason (optional)</FieldLabel>
          <Textarea
            id="reject-reason"
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
          <FieldDescription>Visible on the campaign review page.</FieldDescription>
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={() => onReject(reason)}>
            Reject
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
