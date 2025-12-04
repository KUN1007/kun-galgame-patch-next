import { Card, CardBody } from '@heroui/card'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { cn } from '~/utils/cn'
import type { PatchResourceHtml } from '~/types/api/patch'

export const ResourceMeta = ({ resource }: { resource: PatchResourceHtml }) => {
  const storageLabel =
    SUPPORTED_RESOURCE_LINK_MAP[resource.storage as 's3' | 'user'] ??
    resource.storage

  const metaItems = [
    {
      label: '存储方式',
      value: storageLabel
    },
    {
      label: '文件大小',
      value: resource.size || '未知'
    },
    {
      label: '热度',
      value: `${resource.download} 次下载 · ${resource.likeCount} 个点赞`
    },
    {
      label: '状态',
      value: resource.status ? '已禁用下载' : '可下载',
      color: resource.status
        ? 'text-danger-500 font-bold'
        : 'text-success-600 font-bold'
    },
    {
      label: '发布时间',
      value: formatDistanceToNow(resource.created)
    },
    {
      label: '最近更新',
      value: formatDistanceToNow(resource.updateTime)
    }
  ]

  return (
    <Card>
      <CardBody className="space-y-4">
        {metaItems.map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className="text-xs uppercase text-default-400 dark:text-default-500">
              {item.label}
            </span>
            <span
              className={cn(
                'text-base font-medium text-default-900 dark:text-white',
                item.color ? item.color : ''
              )}
            >
              {item.value}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}
