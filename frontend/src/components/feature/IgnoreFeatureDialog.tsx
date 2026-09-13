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

type IgnoreFeatureDialogProps = {
  open: boolean
  title: string
  onCancel: () => void
  onConfirm: () => void
}

export function IgnoreFeatureDialog({
  open,
  title,
  onCancel,
  onConfirm,
}: IgnoreFeatureDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ignore this feature event?</AlertDialogTitle>
          <AlertDialogDescription>
            {title} will leave the queue. You can show ignored events later and
            restore it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            Ignore
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
