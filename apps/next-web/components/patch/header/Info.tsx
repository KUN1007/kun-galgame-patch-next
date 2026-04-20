'use client'

import { Chip, Divider, Tooltip } from '@heroui/react'
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
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  useDisclosure
} from '@heroui/react'
import { useMemo } from 'react'
import { EditBanner } from './EditBanner'
import type { PatchHeader } from '~/types/api/patch'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'

interface PatchHeaderInfoProps {
  patch: PatchHeader
}

export const PatchHeaderInfo = ({ patch }: PatchHeaderInfoProps) => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  const patchName = useMemo(() => getPreferredLanguageText(patch.name), [])

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="relative w-full h-full overflow-hidden md:col-span-1 aspect-video rounded-2xl">
        <Image
          src={patch.banner ? patch.banner : '/kungalgame-trans.webp'}
          alt={patchName}
          className="object-cover"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          priority
          unoptimized
        />

        <div className="absolute top-2 right-2 z-10">
          <Button size="sm" color="secondary" variant="flat" onPress={onOpen}>
            查看封面
          </Button>
        </div>

        <EditBanner patch={patch} />
      </div>

      <div className="flex flex-col gap-3 md:px-6 md:col-span-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            {patchName}
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

        <div className="flex items-center flex-wrap gap-2">
          {Object.entries(patch.name)
            .filter(([_, value]) => value && value !== patchName)
            .map(([key, value]) => (
              <span className="text-xs text-default-500" key={key}>
                {value}
              </span>
            ))}
        </div>

        <Tags
          platform={patch.platform}
          language={patch.language}
          type={patch.type}
        />

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
          <KunCardStats patch={patch} disableTooltip={false} isMobile={false} />
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
            <ModalContent>
              <ModalHeader>全部封面（{patch.cover.length}）</ModalHeader>
              <ModalBody>
                <div className="flex flex-col gap-3">
                  {patch.cover.length ? (
                    patch.cover.map((c) => (
                      <img key={c.image_id} src={c.url} alt={c.image_id} />
                    ))
                  ) : (
                    <div className="text-sm text-default-400">暂无封面</div>
                  )}
                </div>
              </ModalBody>
            </ModalContent>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}
