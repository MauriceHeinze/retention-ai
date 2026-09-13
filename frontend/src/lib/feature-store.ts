import { useSyncExternalStore } from 'react'

const STORAGE_KEY = 'retention-ai:ignored-features'
type Listener = () => void
const listeners = new Set<Listener>()

function loadIgnored(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((value): value is string => typeof value === 'string')
  } catch {
    return []
  }
}

let ignoredIds = loadIgnored()

function emit() {
  for (const listener of listeners) listener()
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ignoredIds))
  emit()
}

export function subscribeToIgnoredFeatures(onStoreChange: Listener) {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getIgnoredFeatureIds() {
  return ignoredIds
}

export function isFeatureIgnored(id: string) {
  return ignoredIds.includes(id)
}

export function ignoreFeature(id: string) {
  if (ignoredIds.includes(id)) return
  ignoredIds = [...ignoredIds, id]
  persist()
}

export function restoreFeature(id: string) {
  if (!ignoredIds.includes(id)) return
  ignoredIds = ignoredIds.filter((value) => value !== id)
  persist()
}

export function useIgnoredFeatureIds() {
  return useSyncExternalStore(
    subscribeToIgnoredFeatures,
    getIgnoredFeatureIds,
    getIgnoredFeatureIds
  )
}
