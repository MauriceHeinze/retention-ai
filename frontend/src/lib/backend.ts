import useSWR from 'swr'
import { z } from 'zod'

const configuredUrl = import.meta.env.VITE_BACKEND_URL || 'https://backend-production-56e12.up.railway.app'
export const BACKEND_URL = configuredUrl.endsWith('/') ? configuredUrl.slice(0, -1) : configuredUrl
const deliverySchema = z.object({
  status: z.enum(['sending', 'accepted', 'failed']),
  messageId: z.string().optional(), error: z.string().optional(),
})
const decisionSchema = z.object({
  customerId: z.string(), decision: z.enum(['match', 'no_match', 'needs_review']),
  reason: z.string(), customerEvidence: z.string().nullable(), releaseEvidence: z.string(),
  draft: z.object({ subject: z.string(), body: z.string() }).nullable(),
})
export const runSchema = z.object({
  id: z.string(), status: z.enum(['running', 'completed', 'failed']),
  createdAt: z.string().optional(), error: z.string().optional(),
  sources: z.object({ release: z.enum(['github', 'fixture']), customers: z.enum(['stripe_sandbox', 'fixture']), assessment: z.literal('live_model') }).optional(),
  release: z.object({ id: z.string(), evidence: z.string(), environment: z.string(), status: z.string() }).optional(),
  customers: z.array(z.object({ id: z.string(), feedback: z.string().nullable(), marketingConsent: z.boolean() })).optional(),
  result: z.object({
    assessment: z.object({ decisions: z.array(decisionSchema) }),
    excludedCustomers: z.number(), steps: z.number(), tools: z.array(z.string()),
  }).optional(),
  deliveries: z.record(z.string(), deliverySchema).optional(),
})
const deploymentsSchema = z.object({ runs: z.array(z.object({
  id: z.string(), status: z.string(), createdAt: z.string(), releaseId: z.string(),
})) })
export type Run = z.infer<typeof runSchema>
export type Decision = z.infer<typeof decisionSchema>

export function trackEvent(event: string) {
  console.info('retentionai_ui', { event })
}

export async function requestBackend(path: string, body?: unknown): Promise<unknown> {
  try {
    const response = await fetch(`${BACKEND_URL}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(20_000),
    })
    const data: unknown = await response.json()
    if (!response.ok) {
      const error = z.object({ error: z.string().max(500) }).safeParse(data)
      throw new Error(error.success ? error.data.error : `Request failed (${response.status}). Please try again.`)
    }
    return data
  } catch (error) {
    trackEvent('api_request_failed')
    if (error instanceof TypeError || (error instanceof DOMException && error.name === 'TimeoutError')) {
      throw new Error('Cannot reach the backend. Check your connection and try again.')
    }
    throw error
  }
}

export function useDeployments() {
  return useSWR('/api/demo/deployments', async path => deploymentsSchema.parse(await requestBackend(path)), {
    refreshInterval: 10_000, errorRetryCount: 2, dedupingInterval: 5_000,
  })
}

export function useRun(id?: string) {
  return useSWR(id ? `/api/demo/runs/${encodeURIComponent(id)}` : null,
    async path => runSchema.parse(await requestBackend(path)), {
      refreshInterval: data => data?.status === 'running' ? 2_500 : 0,
      errorRetryCount: 2, dedupingInterval: 2_000,
    })
}

export async function startDemo() {
  trackEvent('demo_started')
  return runSchema.parse(await requestBackend('/api/demo/runs', {}))
}

export async function sendDraft(runId: string, customerId: string) {
  trackEvent('draft_send_approved')
  return deliverySchema.parse(await requestBackend(`/api/demo/runs/${encodeURIComponent(runId)}/send`, { customerId, approved: true }))
}

export function errorMessage(error: unknown) {
  return error instanceof z.ZodError ? 'The backend returned an unexpected response. Please refresh.'
    : error instanceof Error ? error.message : 'Something went wrong. Please try again.'
}
