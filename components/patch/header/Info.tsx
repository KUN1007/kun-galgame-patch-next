'use client'

import { Card, CardBody } from '@heroui/card'
import { Divider } from '@heroui/divider'
import { Chip, Tooltip } from '@heroui/react'
import { KunCardStats } from '~/components/kun/CardStats'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import {
  GALGAME_AGE_LIMIT_DETAIL,
  GALGAME_AGE_LIMIT_MAP
} from '~/constants/galgame'
import { PatchHeaderActions } from './Actions'
import { Tags } from './Tags'
import Image from 'next/image'
import { EditBanner } from './EditBanner'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderInfoProps {
  patch: Patch
}

export const PatchHeaderInfo = ({ patch }: PatchHeaderInfoProps) => {
  return (
    <Card>
      <CardBody className="p-0">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative w-full h-full overflow-hidden md:col-span-1 aspect-video md:rounded-l-xl">
            <Image
              src={patch.banner}
              alt={patch.name}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
              unoptimized
            />

            <EditBanner patch={patch} />
          </div>

          <div className="flex flex-col gap-4 p-6 md:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
                {patch.name}
              </h1>
              <Tooltip content={GALGAME_AGE_LIMIT_DETAIL[patch.content_limit]}>
                <Chip
                  color={patch.content_limit === 'sfw' ? 'success' : 'danger'}
                  variant="flat"
                >
                  {GALGAME_AGE_LIMIT_MAP[patch.content_limit]}
                </Chip>
              </Tooltip>
            </div>

            <div className="flex flex-wrap gap-2">
              <Tags patch={patch} />
            </div>

            <PatchHeaderActions patch={patch} />

            <Divider />

            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <KunUser
                user={patch.user}
                userProps={{
                  name: (
                    <span className="text-sm text-default-700">
                      {patch.user.name} · 发布于{' '}
                      {formatDistanceToNow(patch.created)}
                    </span>
                  ),
                  description: (
                    <span className="text-xs text-default-500">
                      资源更新于 {formatDistanceToNow(patch.resourceUpdateTime)}
                    </span>
                  ),
                  avatarProps: {
                    showFallback: true,
                    name: patch.user.name.charAt(0).toUpperCase(),
                    src: patch.user.avatar,
                    size: 'sm',
                    className: 'border border-default-300'
                  }
                }}
              />
              <KunCardStats
                patch={patch}
                disableTooltip={false}
                isMobile={false}
              />
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
