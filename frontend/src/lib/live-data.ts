import useSWR from 'swr'
import { requestBackend, runSchema, useDeployments, type Run } from '@/lib/backend'
import type { Campaign, Feature } from '@/data/mock'
import type { FeatureEvent } from '@/data/feature-events'

export function releaseTitle(run: Run) {
  const message = run.release?.evidence.split('Commit messages:\n\n')[1]?.split('\n\n')[0]
  if (!message) return 'Sample release analysis'
  const title = message.includes(':') ? message.slice(message.indexOf(':') + 1).trim() : message
  return title.charAt(0).toUpperCase() + title.slice(1)
}

export function useLiveData() {
  const deployments = useDeployments()
  const ids = deployments.data?.runs.map(run => run.id) ?? []
  const reviews = useSWR(deployments.data ? ['deployment-reviews', ids.join(',')] : null,
    async () => Promise.all(ids.map(async id => runSchema.parse(await requestBackend(`/api/demo/runs/${id}`)))),
    { refreshInterval: 20_000, errorRetryCount: 1, dedupingInterval: 5_000 })
  const runs = reviews.data ?? []
  const features: FeatureEvent[] = runs.map(run => ({
    id: `live/${run.id}`, title: releaseTitle(run),
    summary: run.result?.assessment.decisions.find(item => item.decision === 'match')?.reason || 'Review the deployed change and customer feedback.',
    description: run.result?.assessment.decisions.find(item => item.decision === 'match')?.reason || 'Review the deployed change and customer feedback.',
    topics: ['GitHub'], keywords: [], pullRequests: [],
    releaseNotes: run.release?.evidence || '',
  }))
  const campaigns: Campaign[] = runs.map(run => {
    const matches = run.result?.assessment.decisions.filter(item => item.decision === 'match') ?? []
    return {
      id: `live/${run.id}`, featureId: `live/${run.id}`,
      name: matches[0]?.draft?.subject || releaseTitle(run), audience: 'Canceled subscribers',
      status: matches.length > 0 && matches.every(item => run.deliveries?.[item.customerId]?.status === 'accepted') ? 'accepted' : 'draft', updatedAt: run.createdAt || '', recipientCount: matches.length,
      sentAt: null, recoveredCustomers: 0, recoveredRevenue: 0,
    }
  })
  return {
    runs, features, campaigns, featuresById: new Map<string, Feature>(features.map(feature => [feature.id, feature])),
    isLoading: deployments.isLoading || reviews.isLoading,
    error: deployments.error || reviews.error,
    refresh: async () => { await deployments.mutate(); await reviews.mutate() },
  }
}
