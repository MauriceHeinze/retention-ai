import { useSyncExternalStore } from 'react'
import {
  countIncluded,
  defaultCampaignContent,
  recipientsForCampaign,
  type CampaignContent,
} from '@/data/campaign-review'
import { campaigns as seedCampaigns, type Campaign, type CampaignStatus } from '@/data/mock'
import { getSavedSettings } from '@/lib/settings-store'

const STORAGE_KEY = 'retention-ai:campaigns'
type Listener = () => void
const listeners = new Set<Listener>()

export type CampaignMeta = {
  rejectReason: string | null
  mailchimpId: string | null
}

type CampaignState = {
  campaigns: Campaign[]
  contents: Record<string, CampaignContent>
  meta: Record<string, CampaignMeta>
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function seedState(): CampaignState {
  const global = getSavedSettings().matching.minMatchStrength
  const campaigns = seedCampaigns.map((campaign) => ({ ...campaign }))
  const contents: Record<string, CampaignContent> = {}
  const meta: Record<string, CampaignMeta> = {}

  for (const campaign of campaigns) {
    const content = defaultCampaignContent(campaign)
    const recipients = recipientsForCampaign(campaign.id, campaign.featureId)
    contents[campaign.id] = content
    campaign.recipientCount = countIncluded(recipients, content, global)
    meta[campaign.id] = {
      rejectReason: campaign.status === 'rejected' ? 'Audience felt too broad.' : null,
      mailchimpId:
        campaign.status === 'approved' || campaign.status === 'sent'
          ? `mc-${campaign.id}`
          : null,
    }
  }

  return { campaigns, contents, meta }
}

function loadState(): CampaignState {
  const seeded = seedState()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seeded
    const parsed = JSON.parse(raw) as Partial<CampaignState>
    return {
      campaigns: parsed.campaigns ?? seeded.campaigns,
      contents: { ...seeded.contents, ...parsed.contents },
      meta: { ...seeded.meta, ...parsed.meta },
    }
  } catch {
    return seeded
  }
}

let state = loadState()

function emit() {
  for (const listener of listeners) listener()
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  emit()
}

function patchCampaign(id: string, patch: Partial<Campaign>) {
  state = {
    ...state,
    campaigns: state.campaigns.map((campaign) =>
      campaign.id === id ? { ...campaign, ...patch } : campaign
    ),
  }
}

export function subscribeToCampaigns(onStoreChange: Listener) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getCampaigns() {
  return state.campaigns
}

export function getCampaign(id: string) {
  return state.campaigns.find((campaign) => campaign.id === id)
}

export function getCampaignContent(id: string) {
  const campaign = getCampaign(id)
  if (state.contents[id]) return state.contents[id]
  return campaign ? defaultCampaignContent(campaign) : null
}

export function getCampaignMeta(id: string): CampaignMeta {
  return state.meta[id] ?? { rejectReason: null, mailchimpId: null }
}

export function saveCampaignContent(id: string, content: CampaignContent) {
  const campaign = getCampaign(id)
  if (!campaign) return

  const global = getSavedSettings().matching.minMatchStrength
  const recipients = recipientsForCampaign(campaign.id, campaign.featureId)

  state = {
    ...state,
    contents: { ...state.contents, [id]: structuredClone(content) },
  }
  patchCampaign(id, {
    recipientCount: countIncluded(recipients, content, global),
    updatedAt: today(),
  })
  persist()
}

export function approveCampaign(id: string, content: CampaignContent) {
  saveCampaignContent(id, content)
  state = {
    ...state,
    meta: {
      ...state.meta,
      [id]: {
        ...getCampaignMeta(id),
        mailchimpId: getCampaignMeta(id).mailchimpId ?? `mc-${id}`,
      },
    },
  }
  patchCampaign(id, { status: 'approved', updatedAt: today() })
  persist()
}

export function rejectCampaign(id: string, reason: string, content: CampaignContent) {
  saveCampaignContent(id, content)
  state = {
    ...state,
    meta: {
      ...state.meta,
      [id]: { ...getCampaignMeta(id), rejectReason: reason.trim() || null },
    },
  }
  patchCampaign(id, { status: 'rejected', updatedAt: today() })
  persist()
}

export function sendCampaign(id: string) {
  patchCampaign(id, { status: 'sent', sentAt: today(), updatedAt: today() })
  persist()
}

export function useCampaigns() {
  return useSyncExternalStore(subscribeToCampaigns, getCampaigns, getCampaigns)
}

export function useCampaign(id: string) {
  return useSyncExternalStore(
    subscribeToCampaigns,
    () => getCampaign(id),
    () => getCampaign(id)
  )
}

export function useCampaignContent(id: string) {
  return useSyncExternalStore(
    subscribeToCampaigns,
    () => getCampaignContent(id),
    () => getCampaignContent(id)
  )
}

export function useCampaignMeta(id: string) {
  return useSyncExternalStore(
    subscribeToCampaigns,
    () => getCampaignMeta(id),
    () => getCampaignMeta(id)
  )
}

export function getCampaignsForFeature(featureId: string) {
  return getCampaigns().filter((campaign) => campaign.featureId === featureId)
}

export function isEditableStatus(status: CampaignStatus) {
  return status === 'draft' || status === 'approved'
}
