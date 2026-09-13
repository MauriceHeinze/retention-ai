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

type ApproveDialogProps = {
  open: boolean
  recipientCount: number
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function ApproveDialog({
  open,
  recipientCount,
  onOpenChange,
  onConfirm,
}: ApproveDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve for Mailchimp</AlertDialogTitle>
          <AlertDialogDescription>
            The final list of {formatNumber(recipientCount)} recipients is synced as
            a Mailchimp cohort, a campaign draft is created or updated, and status
            becomes Approved. Sending happens from this page.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Approve</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
