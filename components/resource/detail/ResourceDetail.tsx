import Image from 'next/image'
import Link from 'next/link'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Divider } from '@heroui/react'
import { KunCardStats } from '~/components/kun/CardStats'
import { ResourceInfo } from '~/components/patch/resource/ResourceInfo'
import { ResourceDownload } from '~/components/patch/resource/ResourceDownload'
import { SUPPORTED_RESOURCE_LINK_MAP } from '~/constants/resource'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchResourceHtml } from '~/types/api/patch'
import type { PatchResource, PatchResourceDetail } from '~/types/api/resource'

interface Props {
  detail: PatchResourceDetail
}

export const KunResourceDetail = ({ detail }: Props) => {
  return (
    <div className="space-y-10">
      <PatchSummary patch={detail.patch} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <Card className="border-default-200 border bg-content1/90 shadow-lg backdrop-blur-sm dark:bg-content1/70">
          <CardBody className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary">资源详情</p>
              <h2 className="text-2xl font-semibold text-default-900 dark:text-white">
                {detail.resource.name ||
                  `${getPreferredLanguageText(detail.patch.name)} 的补丁资源`}
              </h2>
              <p className="text-small text-default-500 dark:text-default-400">
                由 {detail.resource.user.name} 提供 ·{' '}
                {formatDistanceToNow(detail.resource.updateTime)} 前更新
              </p>
            </div>

            <Divider />

            <ResourceInfo resource={detail.resource} />

            <Divider />

            <ResourceDownload resource={detail.resource} />
          </CardBody>
        </Card>

        <div className="space-y-6">
          <ResourceMeta resource={detail.resource} />
          <ResourceRecommendations recommendations={detail.recommendations} />
        </div>
      </div>
    </div>
  )
}

const PatchSummary = ({ patch }: { patch: PatchResourceDetail['patch'] }) => {
  const patchName = getPreferredLanguageText(patch.name)
  const alias = patch.alias.filter((item) => item && item !== patchName)
  const banner = patch.banner || '/kungalgame-trans.webp'

  return (
    <section className="relative overflow-hidden rounded-3xl border border-default-200 bg-gradient-to-br from-white via-default-50 to-default-100 text-default-900 shadow-2xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 dark:text-white">
      <div className="absolute inset-0">
        <Image
          src={banner}
          alt={patchName}
          fill
          className="object-cover opacity-30 dark:opacity-50"
          sizes="(max-width: 1024px) 100vw, 1280px"
          priority
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-br from-white via-white/70 to-transparent dark:from-[#030712]/80 dark:via-[#0f172a]/70 dark:to-transparent" />
      </div>

      <div className="relative z-10 grid gap-10 p-8 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.4em] text-default-600 dark:text-white/70">
            Galgame Patch
          </p>
          <h1 className="text-3xl font-semibold leading-snug text-default-900 dark:text-white sm:text-4xl">
            {patchName}
          </h1>
          {alias.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {alias.slice(0, 4).map((name) => (
                <Chip key={name} size="sm" variant="flat" color="secondary">
                  {name}
                </Chip>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 text-sm text-default-600 dark:text-white/70">
            {[patch.released, ...patch.language, ...patch.platform]
              .filter(Boolean)
              .map((item, index) => (
                <span
                  key={`${item}-${index}`}
                  className="rounded-full border border-default-200/70 px-3 py-1 dark:border-white/30"
                >
                  {item}
                </span>
              ))}
          </div>

          <KunCardStats patch={patch} disableTooltip={false} isMobile={false} />

          <div className="flex flex-wrap gap-3 pt-2 text-sm font-medium">
            <Link
              href={`/patch/${patch.id}/introduction`}
              className="inline-flex items-center rounded-full bg-white/80 px-4 py-2 text-default-900 shadow-sm transition hover:bg-white dark:bg-white/20 dark:text-white dark:hover:bg-white/30"
            >
              查看补丁介绍
            </Link>
            <Link
              href={`/patch/${patch.id}/resource`}
              className="inline-flex items-center rounded-full bg-white/40 px-4 py-2 text-default-900 transition hover:bg-white/60 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              查看全部资源
            </Link>
          </div>
        </div>

        <div className="rounded-2xl bg-white/90 p-6 text-default-900 backdrop-blur-sm dark:bg-white/10 dark:text-white">
          <p className="text-sm uppercase tracking-[0.3em] text-default-600 dark:text-white/70">
            补丁概览
          </p>
          <dl className="mt-4 space-y-4">
            <div>
              <dt className="text-xs uppercase text-default-500 dark:text-white/60">
                发行时间
              </dt>
              <dd className="text-lg font-semibold">
                {patch.released || '待定'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-default-500 dark:text-white/60">
                支持语言
              </dt>
              <dd className="text-base">
                {patch.language.length ? patch.language.join('、') : '暂无标注'}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-default-500 dark:text-white/60">
                支持平台
              </dt>
              <dd className="text-base">
                {patch.platform.length ? patch.platform.join('、') : '暂无标注'}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  )
}

const ResourceMeta = ({ resource }: { resource: PatchResourceHtml }) => {
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
      color: resource.status ? 'text-danger-500' : 'text-success-500'
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
    <Card className="border-default-200 border bg-content2/80 backdrop-blur-sm dark:bg-content2/40">
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="text-small font-medium text-default-500 dark:text-default-400">
          资源信息
        </p>
        <h3 className="text-lg font-semibold text-default-900 dark:text-white">
          快速状态
        </h3>
      </CardHeader>
      <CardBody className="space-y-4">
        {metaItems.map((item) => (
          <div key={item.label} className="flex flex-col">
            <span className="text-xs uppercase text-default-400 dark:text-default-500">
              {item.label}
            </span>
            <span
              className={`text-base font-medium text-default-900 dark:text-white ${item.color ? item.color : ''}`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </CardBody>
    </Card>
  )
}

const ResourceRecommendations = ({
  recommendations
}: {
  recommendations: PatchResource[]
}) => {
  if (!recommendations.length) {
    return (
      <Card className="border-default-200 border bg-content2/80 backdrop-blur-sm dark:bg-content2/40">
        <CardHeader className="flex flex-col items-start gap-1">
          <p className="text-small font-medium text-default-500 dark:text-default-400">
            补丁资源推荐
          </p>
          <h3 className="text-lg font-semibold text-default-900 dark:text-white">
            欢迎分享
          </h3>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-default-500 dark:text-default-400">
            暂无推荐，欢迎在该 Galgame 下发布更多补丁资源～
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <Card className="border-default-200 border bg-content2/80 backdrop-blur-sm dark:bg-content2/40">
      <CardHeader className="flex flex-col items-start gap-1">
        <p className="text-small font-medium text-default-500 dark:text-default-400">
          补丁资源推荐
        </p>
        <h3 className="text-lg font-semibold text-default-900 dark:text-white">
          同系列资源
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
                  {resource.name || '未命名资源'}
                </p>
                <p className="text-xs text-default-500 dark:text-default-400">
                  来自 {getPreferredLanguageText(resource.patchName)}
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
