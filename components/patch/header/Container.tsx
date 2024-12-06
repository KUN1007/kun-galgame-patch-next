'use client'

import { useEffect } from 'react'
import { Card, CardBody } from '@nextui-org/card'
import { User } from '@nextui-org/user'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Divider } from '@nextui-org/divider'
import { Pencil, Share2 } from 'lucide-react'
import { ResourceFavoriteButton } from './PatchFavorite'
import { useRouter } from 'next-nprogress-bar'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { KunCardStats } from '~/components/kun/CardStats'
import { PatchHeader } from './Header'
import { PatchHeaderTabs } from './Tabs'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { Tags } from './Tags'
import Image from 'next/image'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const PatchHeaderContainer = ({ patch }: PatchHeaderProps) => {
  const router = useRouter()

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

        <Card className="absolute bottom-[-1] w-full rounded-none rounded-b-2xl bg-background/70 shadow-lg backdrop-blur-xl">
          <CardBody>
            <div className="flex flex-col items-start justify-between space-y-2 sm:flex-row">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">{patch.name}</h1>
                <div className="flex-wrap hidden gap-2 sm:flex">
                  <Tags patch={patch} />
                </div>
              </div>
              <div className="flex gap-2 ml-auto">
                <ResourceFavoriteButton
                  patchId={patch.id}
                  isFavorite={patch.isFavorite}
                />
                <Tooltip content="复制分享链接">
                  <Button variant="bordered" isIconOnly>
                    <Share2 className="size-4" />
                  </Button>
                </Tooltip>
                <Tooltip
                  content={
                    <div className="px-1 py-2">
                      <div className="font-bold text-small">编辑游戏信息</div>
                      <div className="text-tiny">任何人都可以编辑游戏信息</div>
                      <div className="text-tiny">但需要提交更新请求</div>
                    </div>
                  }
                >
                  <Button
                    variant="bordered"
                    isIconOnly
                    onClick={() => router.push('/edit/rewrite')}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </Tooltip>
              </div>
            </div>

            <Divider className="my-4" />

            <div className="flex gap-6 text-sm">
              <User
                name={
                  <div className="space-x-2">
                    <span>{patch.user.name}</span>
                    <span className="text-default-500">-</span>
                    <span className="text-default-500">
                      {formatDistanceToNow(patch.created)}
                    </span>
                  </div>
                }
                description={
                  <KunCardStats patch={patch} disableTooltip={false} />
                }
                avatarProps={{
                  showFallback: true,
                  name: patch.user.name.charAt(0).toUpperCase(),
                  src: patch.user.avatar
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
