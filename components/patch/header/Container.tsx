'use client'

import { useEffect } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { Divider } from '@nextui-org/divider'
import { FavoriteButton } from './FavoriteButton'
import { ShareButton } from './ShareButton'
import { EditButton } from './EditButton'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { KunCardStats } from '~/components/kun/CardStats'
import { PatchHeader } from './Header'
import { PatchHeaderTabs } from './Tabs'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Tags } from './Tags'
import Image from 'next/image'
import { KunUser } from '~/components/kun/floating-card/KunUser'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const PatchHeaderContainer = ({ patch }: PatchHeaderProps) => {
  const { setData } = useRewritePatchStore()

  useEffect(() => {
    setData({
      id: patch.id,
      name: patch.name,
      introduction: patch.introduction,
      alias: patch.alias
    })

    // TODO:
    window.scroll(0, 0)
  }, [])

  return (
    <>
      <div className="relative h-[512px] w-full">
        <Image
          src={patch.banner}
          alt={patch.name}
          className="absolute top-0 left-0 object-cover size-full rounded-2xl"
          fill
          sizes="100vw"
          priority
        />
        <PatchHeader patch={patch} />

        <Card className="absolute bottom-0 w-full rounded-none shadow-lg rounded-b-2xl bg-background/70 backdrop-blur-xl">
          <CardBody>
            <div className="flex flex-col items-start justify-between space-y-2 sm:flex-row">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{patch.name}</h1>
                <div className="flex-wrap hidden gap-2 sm:flex">
                  <Tags patch={patch} />
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <FavoriteButton
                  patchId={patch.id}
                  isFavorite={patch.isFavorite}
                />
                <ShareButton patch={patch} />
                <EditButton />
              </div>
            </div>

            <Divider className="my-4" />

            <div className="flex gap-6 text-sm">
              <KunUser
                user={patch.user}
                userProps={{
                  name: `${patch.user.name} - ${formatDistanceToNow(patch.created)}`,
                  description: (
                    <KunCardStats patch={patch} disableTooltip={false} />
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
