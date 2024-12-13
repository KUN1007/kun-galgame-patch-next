'use client'

import { useState } from 'react'
import { kunFetchPut } from '~/utils/kunFetch'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Heart } from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import toast from 'react-hot-toast'
import { kunErrorHandler } from '~/utils/kunErrorHandler'
import { cn } from '~/utils/cn'

interface Props {
  patchId: number
  isFavorite: boolean
}

export const FavoriteButton = ({ patchId, isFavorite }: Props) => {
  const { user } = useUserStore((state) => state)
  const [favorite, setFavorite] = useState(isFavorite)
  const [loading, setLoading] = useState(false)

  const toggleLike = async () => {
    if (!user.uid) {
      toast.error('请登录以收藏')
      return
    }

    setLoading(true)
    const res = await kunFetchPut<KunResponse<boolean>>('/patch/like', {
      patchId
    })

    setLoading(false)
    kunErrorHandler(res, (value) => {
      setFavorite(value)
    })
  }

  return (
    <Tooltip key="favorite" color="default" content="收藏">
      <Button
        isIconOnly
        variant="bordered"
        disabled={loading}
        isLoading={loading}
        onClick={toggleLike}
        className="min-w-0 px-2"
        aria-label="收藏"
      >
        <Heart
          fill={favorite ? '#f31260' : '#00000000'}
          className={cn('size-4', favorite ? 'text-danger-500' : '')}
        />
      </Button>
    </Tooltip>
  )
}
