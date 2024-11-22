'use client'

import { useState } from 'react'
import { api } from '~/lib/trpc-client'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Heart } from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import toast from 'react-hot-toast'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { cn } from '~/utils/cn'

interface Props {
  patchId: number
  isFavorite: boolean
}

export const ResourceFavoriteButton = ({ patchId, isFavorite }: Props) => {
  const { user } = useUserStore((state) => state)
  const [favorite, setFavorite] = useState(isFavorite)
  const [loading, setLoading] = useState(false)

  const toggleLike = async () => {
    if (!user.uid) {
      toast.error('请登录以收藏')
      return
    }

    setLoading(true)
    const res = await api.patch.togglePatchFavorite.mutate({
      patchId
    })
    setLoading(false)
    useErrorHandler(res, (value) => {
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
      >
        <Heart className={cn('w-4 h-4', favorite ? 'text-danger-500' : '')} />
      </Button>
    </Tooltip>
  )
}
