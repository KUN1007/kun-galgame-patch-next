'use client'

import { Chip, Tooltip } from '@nextui-org/react'
import { FavoriteButton } from './button/FavoriteButton'
import { ShareButton } from './button/ShareButton'
import { EditButton } from './button/EditButton'
import { DownloadButton } from './button/DownloadButton'
import { DeleteButton } from './button/DeleteButton'
import { Tags } from './Tags'
import {
  GALGAME_AGE_LIMIT_DETAIL,
  GALGAME_AGE_LIMIT_MAP
} from '~/constants/galgame'
import type { Patch } from '~/types/api/patch'

interface Props {
  patch: Patch
}

export const ButtonList = ({ patch }: Props) => {
  return (
    <div className="flex flex-col items-start justify-between space-y-2 sm:space-y-0 sm:flex-row">
      <div className="space-y-2">
        <h1 className="text-xl font-bold sm:text-3xl">
          <span className="align-middle">{patch.name}</span>
          <Tooltip content={GALGAME_AGE_LIMIT_DETAIL[patch.content_limit]}>
            <Chip
              color={patch.content_limit === 'sfw' ? 'success' : 'danger'}
              variant="flat"
              className="ml-2 align-middle"
            >
              {GALGAME_AGE_LIMIT_MAP[patch.content_limit]}
            </Chip>
          </Tooltip>
        </h1>
        <div className="flex-wrap hidden gap-2 sm:flex">
          <Tags patch={patch} />
        </div>
      </div>

      <div className="flex flex-col items-start space-y-2 sm:items-end">
        <div className="flex gap-2">
          <DownloadButton patch={patch} />
          <FavoriteButton patchId={patch.id} isFavorite={patch.isFavorite} />
          <ShareButton patch={patch} />
          <EditButton />
          <DeleteButton patch={patch} />
        </div>

        <p className="text-sm text-default-500">
          收藏后, 有新补丁资源发布时, 您将收到通知
        </p>
      </div>
    </div>
  )
}
