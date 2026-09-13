import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import type { CampaignStatus } from '@/data/mock'
import { mailchimpUrl } from '@/data/campaign-review'
import { ApproveDialog } from '@/components/campaign/ApproveDialog'
import { RejectDialog } from '@/components/campaign/RejectDialog'
import { SendDialog } from '@/components/campaign/SendDialog'

type CampaignActionsProps = {
  status: CampaignStatus
  dirty: boolean
  recipientCount: number
  mailchimpId: string | null
  onSave: () => void
  onReject: (reason: string) => void
  onApprove: () => void
  onSend: () => void
}

export function CampaignActions({
  status,
  dirty,
  recipientCount,
  mailchimpId,
  onSave,
  onReject,
  onApprove,
  onSend,
}: CampaignActionsProps) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [approveOpen, setApproveOpen] = useState(false)
  const [sendOpen, setSendOpen] = useState(false)
  const canEdit = status === 'draft' || status === 'approved'

  if (status === 'sent') {
    return (
      <ActionBar>
        {mailchimpId ? <OpenMailchimpButton mailchimpId={mailchimpId} /> : null}
      </ActionBar>
    )
  }

  if (status === 'rejected') {
    return null
  }

  return (
    <>
      <ActionBar>
        {canEdit ? (
          <Button variant="outline" disabled={!dirty} onClick={onSave}>
            Save changes
          </Button>
        ) : null}
        {status === 'draft' ? (
          <Button variant="destructive" onClick={() => setRejectOpen(true)}>
            Reject campaign
          </Button>
        ) : null}
        <div className="flex flex-1 flex-wrap justify-end gap-2">
          {mailchimpId ? <OpenMailchimpButton mailchimpId={mailchimpId} /> : null}
          {status === 'draft' ? (
            <Button disabled={recipientCount === 0} onClick={() => setApproveOpen(true)}>
              Approve for Mailchimp
            </Button>
          ) : null}
          {status === 'approved' ? (
            <Button disabled={recipientCount === 0} onClick={() => setSendOpen(true)}>
              Send campaign
            </Button>
          ) : null}
        </div>
      </ActionBar>

      <RejectDialog
        key={rejectOpen ? 'open' : 'closed'}
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        onReject={(reason) => {
          setRejectOpen(false)
          onReject(reason)
        }}
      />
      <ApproveDialog
        open={approveOpen}
        recipientCount={recipientCount}
        onOpenChange={setApproveOpen}
        onConfirm={() => {
          setApproveOpen(false)
          onApprove()
        }}
      />
      <SendDialog
        open={sendOpen}
        recipientCount={recipientCount}
        onOpenChange={setSendOpen}
        onConfirm={() => {
          setSendOpen(false)
          onSend()
        }}
      />
    </>
  )
}

function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-10 -mx-4 border-t bg-background px-4 py-3 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  )
}

function OpenMailchimpButton({ mailchimpId }: { mailchimpId: string }) {
  return (
    <Button
      variant="outline"
      onClick={() =>
        window.open(mailchimpUrl(mailchimpId), '_blank', 'noopener,noreferrer')
      }
    >
      Open in Mailchimp
    </Button>
  )
}
