'use client'

import { useEffect } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Divider } from '@nextui-org/divider'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { KunAutoImageViewer } from '~/components/kun/image-viewer/AutoImageViewer'
import { KunCardStats } from '~/components/kun/CardStats'
import { PatchHeader } from './Header'
import { PatchHeaderTabs } from './Tabs'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Tags } from './Tags'
import Image from 'next/image'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import { ButtonList } from './ButtonList'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
  intro: PatchIntroduction
}

export const PatchHeaderContainer = ({ patch, intro }: PatchHeaderProps) => {
  const { setData } = useRewritePatchStore()

  useEffect(() => {
    setData({
      id: patch.id,
      vndbId: patch.vndbId ?? '',
      name: patch.name,
      introduction: patch.introduction,
      alias: patch.alias,
      released: intro.released
    })

    // TODO:
    window.scroll(0, 0)
  }, [])

  return (
    <>
      <div className="relative w-full h-[300px] sm:h-[400px] md:h-[512px]">
        <KunAutoImageViewer />
        <Image
          src={patch.banner}
          alt={patch.name}
          className="absolute top-0 left-0 object-cover size-full rounded-t-2xl rounded-b-3xl"
          fill
          sizes="100vw"
          priority
          unoptimized
        />

        <PatchHeader patch={patch} />
        <Card className="absolute bottom-0 w-full rounded-none shadow-lg rounded-b-2xl bg-background/70 backdrop-blur-xl">
          <CardBody>
            <ButtonList patch={patch} />

            <Divider className="my-4" />

            <div className="flex gap-6 text-sm">
              <KunUser
                user={patch.user}
                userProps={{
                  name: `${patch.user.name} - 发布于 ${formatDistanceToNow(patch.created)} - 资源更新于 ${formatDistanceToNow(patch.resourceUpdateTime)}`,
                  description: (
                    <KunCardStats
                      patch={patch}
                      disableTooltip={false}
                      isMobile={false}
                    />
                  ),
                  avatarProps: {
                    showFallback: true,
                    name: patch.user.name.charAt(0).toUpperCase(),
                    src: patch.user.avatar
                  }
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2 sm:hidden">
        <Tags patch={patch} />
      </div>

      <PatchHeaderTabs id={patch.id} />
    </>
  )
}
