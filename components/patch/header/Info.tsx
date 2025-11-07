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
import {
  Button,
  Image as HeroImage,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure
} from '@heroui/react'
import { useState } from 'react'
import { EditBanner } from './EditBanner'
import type { PatchHeader } from '~/types/api/patch'

interface PatchHeaderInfoProps {
  patch: PatchHeader
}

export const PatchHeaderInfo = ({ patch }: PatchHeaderInfoProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const [covers, setCovers] = useState<
    Array<{
      image_id: string
      url: string
      width: number
      height: number
      thumbnail_url: string
      thumb_width: number
      thumb_height: number
    }>
  >([])
  const [loadingCovers, setLoadingCovers] = useState(false)

  // TODO:
  const ensureCovers = async () => {
    if (covers.length || loadingCovers) return
    try {
      setLoadingCovers(true)
      const res = await fetch(`/api/patch/detail?patchId=${patch.id}`, {
        cache: 'no-store'
      })
      const json = await res.json()
      const list = Array.isArray(json?.cover) ? json.cover : []
      setCovers(list)
    } catch {
    } finally {
      setLoadingCovers(false)
    }
  }

  return (
    <div>
      <div className="p-0">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative w-full h-full overflow-hidden md:col-span-1 aspect-video md:rounded-2xl">
            <Image
              src={patch.banner}
              alt={patch.name}
              className="object-cover"
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              priority
              unoptimized
            />

            <div className="absolute top-2 right-2 z-10">
              <Button
                size="sm"
                color="secondary"
                variant="flat"
                onPress={async () => {
                  await ensureCovers()
                  onOpen()
                }}
              >
                查看封面
              </Button>
            </div>

            <EditBanner patch={patch} />
          </div>

          <div className="flex flex-col gap-4 px-6 md:col-span-2">
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
      </div>

      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent>
          {() => (
            <>
              <ModalHeader>全部封面（{covers.length}）</ModalHeader>
              <ModalBody>
                {loadingCovers && (
                  <div className="text-sm text-default-500">加载中...</div>
                )}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {covers.map((c) => (
                    <div
                      key={c.image_id || c.url}
                      className="aspect-[4/3] bg-default-100 rounded-lg overflow-hidden"
                    >
                      <HeroImage
                        src={c.url}
                        alt={c.image_id}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {!covers.length && !loadingCovers && (
                    <div className="text-sm text-default-400">暂无封面</div>
                  )}
                </div>
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
