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
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type TestEmailDialogProps = {
  open: boolean
  defaultEmail: string
  onOpenChange: (open: boolean) => void
  onSend: (email: string) => void
}

export function TestEmailDialog({
  open,
  defaultEmail,
  onOpenChange,
  onSend,
}: TestEmailDialogProps) {
  const [email, setEmail] = useState(defaultEmail)

  function handleOpenChange(next: boolean) {
    if (next) setEmail(defaultEmail)
    onOpenChange(next)
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send test email</AlertDialogTitle>
          <AlertDialogDescription>
            Sends a copy of the current draft. Nothing is delivered to the campaign
            audience.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Field>
          <FieldLabel htmlFor="test-email">Send to</FieldLabel>
          <Input
            id="test-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={!email.includes('@')}
            onClick={() => onSend(email.trim())}
          >
            Send
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
