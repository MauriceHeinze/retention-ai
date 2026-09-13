import { CampaignStatusBadge } from '@/components/CampaignStatusBadge'
import { Link } from '@/components/Link'
import { getCampaignsForFeature, getFeature } from '@/data/mock'

export default function FeatureDetailPage({ featureId }: { featureId: string }) {
  const feature = getFeature(featureId)

  if (!feature) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-2xl font-medium tracking-tight">
          Feature nicht gefunden
        </h1>
        <p className="text-sm text-muted-foreground">
          Dieses Feature existiert nicht.
        </p>
        <Link href="/features" className="text-sm text-primary hover:underline">
          Zurück zu Features
        </Link>
      </div>
    )
  }

  const relatedCampaigns = getCampaignsForFeature(feature.id)

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
        <h2 className="font-heading text-base font-medium">Kampagnen</h2>
        {relatedCampaigns.length === 0 ? (
          <p className="text-sm text-muted-foreground">Keine Kampagnen vorhanden.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {relatedCampaigns.map((campaign) => (
              <li key={campaign.id} className="flex items-center justify-between gap-4">
                <Link href="/kampagnen" className="text-sm hover:underline">
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
