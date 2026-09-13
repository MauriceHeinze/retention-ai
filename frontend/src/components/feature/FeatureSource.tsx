import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { FeatureEvent } from '@/data/feature-events'
import { formatDate } from '@/lib/format'

export function FeatureSource({ feature }: { feature: FeatureEvent }) {
  return (
    <div className="flex max-w-3xl flex-col gap-10">
      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Summary</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {feature.description}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {feature.topics.map((topic) => (
            <Badge key={topic} variant="secondary">
              {topic}
            </Badge>
          ))}
          {feature.keywords.map((keyword) => (
            <Badge key={keyword} variant="outline">
              {keyword}
            </Badge>
          ))}
        </div>
      </section>

      <Separator />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-lg font-medium">Pull requests</h2>
        <ul className="flex flex-col gap-4">
          {feature.pullRequests.map((pullRequest) => (
            <li key={pullRequest.number} className="flex flex-col gap-1">
              <a
                href={pullRequest.url}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                #{pullRequest.number} {pullRequest.title}
              </a>
              <p className="text-sm text-muted-foreground">
                Merged {formatDate(pullRequest.mergedAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <Separator />

      <section className="flex flex-col gap-3">
        <h2 className="font-heading text-lg font-medium">Release notes</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {feature.releaseNotes}
        </p>
      </section>
    </div>
  )
}
