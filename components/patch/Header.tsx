'use client'

import { useEffect } from 'react'
import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Divider } from '@nextui-org/divider'
import { Eye, Heart, MessageSquare, Share2, Puzzle, Pencil } from 'lucide-react'
import { ResourceFavoriteButton } from './PatchFavorite'
import { Tabs, Tab } from '@nextui-org/tabs'
import { usePathname, useRouter } from 'next/navigation'
import { useRewritePatchStore } from '~/store/rewriteStore'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const PatchHeader = ({ patch }: PatchHeaderProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const lastSegment = pathname.split('/').filter(Boolean).pop()

  const { setData } = useRewritePatchStore()

  useEffect(() => {
    setData({
      id: patch.id,
      banner: patch.banner,
      name: patch.name,
      introduction: patch.introduction,
      alias: patch.alias
    })
  }, [])

  return (
    <>
      <Card>
        <CardHeader className="relative h-full p-0">
          <img
            src={patch.banner}
            alt={patch.name}
            className="w-full max-h-[720px] h-[312px] object-cover"
          />
        </CardHeader>
        <CardBody>
          <div className="flex flex-col items-start justify-between space-y-2 sm:flex-row">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{patch.name}</h1>
              <div className="flex flex-wrap gap-2">
                {patch.platform.length > 0 &&
                  patch.platform.map((platform) => (
                    <Chip key={platform} variant="flat">
                      {platform}
                    </Chip>
                  ))}

                {patch.language.length > 0 &&
                  patch.language.map((language) => (
                    <Chip key={language} color="primary" variant="flat">
                      {language}
                    </Chip>
                  ))}

                {patch.type.length > 0 &&
                  patch.type.map((type) => (
                    <Chip key={type} color="primary" variant="solid">
                      {type}
                    </Chip>
                  ))}
              </div>
            </div>
            <div className="flex gap-2 ml-auto">
              <ResourceFavoriteButton
                patchId={patch.id}
                isFavorite={patch.isFavorite}
              />
              <Tooltip content="复制分享链接">
                <Button variant="bordered" isIconOnly>
                  <Share2 className="w-4 h-4" />
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
                  <Pencil className="w-4 h-4" />
                </Button>
              </Tooltip>
            </div>
          </div>

          <Divider className="my-4" />

          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-1">
              <Avatar
                showFallback
                name={patch.user.name.charAt(0).toUpperCase()}
                src={patch.user.avatar}
              />
              <span>{patch.user.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{patch.view}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{patch._count.favorite_by || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Puzzle className="w-4 h-4" />
              <span>{patch._count.resource || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              <span>{patch._count.comment || 0}</span>
            </div>
          </div>
        </CardBody>
      </Card>

      <Tabs
        aria-label="Options"
        className="w-full my-6 overflow-hidden shadow-medium rounded-large"
        fullWidth={true}
        selectedKey={lastSegment}
      >
        <Tab
          key="introduction"
          title="游戏介绍"
          className="p-0"
          href={`/patch/${patch.id}/introduction`}
        />
        <Tab
          key="resource"
          title="资源链接"
          className="p-0"
          href={`/patch/${patch.id}/resource`}
        />
        <Tab
          key="comment"
          title="游戏评论"
          className="p-0"
          href={`/patch/${patch.id}/comment`}
        />
        <Tab
          key="history"
          title="贡献历史"
          className="p-0"
          href={`/patch/${patch.id}/history`}
        />
      </Tabs>
    </>
  )
}
