import Link from 'next/link'
import { Card, CardBody } from '@heroui/card'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { markdownToText } from '~/utils/markdownToText'
import type { PatchResource } from '~/types/api/resource'

export const ResourceRecommendations = ({
  recommendations
}: {
  recommendations: PatchResource[]
}) => {
  return (
    <Card>
      <CardBody className="space-y-4">
        {recommendations.map((resource) => (
          <Link
            key={resource.id}
            href={`/resource/${resource.id}`}
            className="block rounded-2xl border border-default-200 p-4 transition hover:border-primary hover:bg-primary-50"
          >
            <p className="text-base font-semibold text-default-900 dark:text-white">
              {resource.name || getPreferredLanguageText(resource.patchName)}
            </p>

            {resource.note && (
              <p className="mt-2 text-sm text-default-500 line-clamp-2 dark:text-default-400">
                {markdownToText(resource.note)}
              </p>
            )}
            <p className="mt-2 text-xs text-default-400">
              {formatDistanceToNow(resource.created)} ·{' '}
              {`由 ${resource.user.name} 发布`}
            </p>

            <div className="flex justify-end items-center gap-1 text-xs text-default-500">
              <div>{resource.download} 次下载</div>·
              <div>{resource.likeCount} 个点赞</div>
            </div>
          </Link>
        ))}
      </CardBody>
    </Card>
  )
}
