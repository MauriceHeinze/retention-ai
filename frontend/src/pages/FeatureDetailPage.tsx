import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { Link } from '@/components/Link'
import { getFeature } from '@/data/mock'
import { useCampaigns } from '@/lib/campaign-store'

export default function FeatureDetailPage({ featureId }: { featureId: string }) {
  const campaigns = useCampaigns()
  const feature = getFeature(featureId)

  if (!feature) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Feature not found
        </h1>
        <p className="text-sm text-muted-foreground">This feature does not exist.</p>
        <Link href="/features" className="text-sm text-primary hover:underline">
          Back to features
        </Link>
      </div>
    )
  }

  const relatedCampaigns = campaigns.filter(
    (campaign) => campaign.featureId === feature.id
  )

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/features" className="hover:underline">
            Features
          </Link>
        </p>
        <h1 className="mt-2 font-heading text-2xl font-medium tracking-tight">
          {feature.title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{feature.summary}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-base font-medium">Campaigns</h2>
        {relatedCampaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No campaigns yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {relatedCampaigns.map((campaign) => (
              <li key={campaign.id} className="flex items-center justify-between gap-4">
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="text-sm hover:underline"
                >
                  {campaign.name}
                </Link>
                <CampaignStatusBadge status={campaign.status} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
