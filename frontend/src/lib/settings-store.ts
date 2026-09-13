import { useSyncExternalStore } from 'react'
import { defaultSettings, githubReposForOrg, type AppSettings, type IntegrationId } from '@/data/settings'

const STORAGE_KEY = 'retention-ai:settings'
type Listener = () => void
const listeners = new Set<Listener>()

function cloneSettings(value: AppSettings): AppSettings {
  return structuredClone(value)
}

function loadSaved(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return cloneSettings(defaultSettings)
    return { ...cloneSettings(defaultSettings), ...JSON.parse(raw) }
  } catch {
    return cloneSettings(defaultSettings)
  }
}

let saved = loadSaved()
let draft = cloneSettings(saved)

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeToSettings(onStoreChange: Listener) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getDraftSettings() {
  return draft
}

export function getSavedSettings() {
  return saved
}

export function isSettingsDirty() {
  return JSON.stringify(draft) !== JSON.stringify(saved)
}

export function setDraftSettings(next: AppSettings) {
  draft = next
  emit()
}

export function updateDraftSettings<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
) {
  draft = { ...draft, [key]: value }
  emit()
}

export function saveSettings() {
  saved = cloneSettings(draft)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
  emit()
}

export function discardSettings() {
  draft = cloneSettings(saved)
  emit()
}

const CONNECTED_ACCOUNTS: Record<IntegrationId, string> = {
  stripe: 'Acme GmbH',
  github: 'acme-gmbh',
  mailchimp: 'Acme',
  slack: 'Acme',
}

export function connectIntegration(id: IntegrationId) {
  const account = CONNECTED_ACCOUNTS[id]

  if (id === 'stripe') {
    updateDraftSettings('stripe', {
      ...draft.stripe,
      status: 'connected',
      account,
    })
    return
  }

  if (id === 'github') {
    updateDraftSettings('github', {
      ...draft.github,
      status: 'connected',
      account,
      organization: draft.github.organization || 'acme-gmbh',
      repositories:
        draft.github.repositories.length > 0
          ? draft.github.repositories
          : githubReposForOrg('acme-gmbh').slice(0, 2),
    })
    return
  }

  if (id === 'mailchimp') {
    updateDraftSettings('mailchimp', {
      ...draft.mailchimp,
      status: 'connected',
      account,
      errorMessage: null,
    })
    return
  }

  updateDraftSettings('slack', {
    ...draft.slack,
    status: 'connected',
    account,
  })
}

export function disconnectIntegration(id: IntegrationId) {
  if (id === 'stripe') {
    updateDraftSettings('stripe', {
      ...draft.stripe,
      status: 'not_connected',
      account: null,
    })
    return
  }

  if (id === 'github') {
    updateDraftSettings('github', {
      ...draft.github,
      status: 'not_connected',
      account: null,
    })
    return
  }

  if (id === 'mailchimp') {
    updateDraftSettings('mailchimp', {
      ...draft.mailchimp,
      status: 'not_connected',
      account: null,
      errorMessage: null,
    })
    return
  }

  updateDraftSettings('slack', {
    ...draft.slack,
    status: 'not_connected',
    account: null,
  })
}

export function useDraftSettings() {
  return useSyncExternalStore(subscribeToSettings, getDraftSettings, getDraftSettings)
}

export function useSettingsDirty() {
  return useSyncExternalStore(subscribeToSettings, isSettingsDirty, () => false)
}
