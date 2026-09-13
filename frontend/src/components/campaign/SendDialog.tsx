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
import { formatNumber } from '@/lib/format'

type SendDialogProps = {
  open: boolean
  recipientCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function SendDialog({
  open,
  recipientCount,
  onOpenChange,
  onConfirm,
}: SendDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send campaign</AlertDialogTitle>
          <AlertDialogDescription>
            This sends the Mailchimp draft to {formatNumber(recipientCount)}{' '}
            recipients. Status becomes Sent.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Send</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
