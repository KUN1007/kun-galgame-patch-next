import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchResource } from '~/types/api/resource'

export const ResourceRecommendations = ({
  recommendations
}: {
  recommendations: PatchResource[]
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-col items-start gap-1">
        <h3 className="text-lg font-semibold text-default-900 dark:text-white">
          同系列 Galgame 补丁资源下载
        </h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {recommendations.map((resource) => (
          <Link
            key={resource.id}
            href={`/resource/${resource.id}`}
            className="block rounded-2xl border border-default-200 p-4 transition hover:border-primary/60"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-base font-semibold text-default-900 dark:text-white">
                  {resource.name ||
                    getPreferredLanguageText(resource.patchName)}
                </p>
              </div>
              <div className="text-right text-xs text-default-500 dark:text-default-400">
                <div>{resource.download} 次下载</div>
                <div>{resource.likeCount} 个点赞</div>
              </div>
            </div>
            {resource.note && (
              <p className="mt-2 text-sm text-default-500 line-clamp-2 dark:text-default-400">
                {resource.note}
              </p>
            )}
            <p className="mt-2 text-xs text-default-400">
              {formatDistanceToNow(resource.created)} 发布 ·{' '}
              {resource.user.name}
            </p>
          </Link>
        ))}
      </CardBody>
    </Card>
  )
}
