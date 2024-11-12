import { useState } from 'react'
import { api } from '~/lib/trpc-client'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Heart } from 'lucide-react'
import { useUserStore } from '~/store/userStore'
import toast from 'react-hot-toast'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { cn } from '~/utils/cn'

interface Props {
  resourceId: number
  likedBy: KunUser[]
  publisher: KunUser
}

export const ResourceLikeButton = ({
  resourceId,
  likedBy,
  publisher
}: Props) => {
  const { user } = useUserStore()
  const isLiked = likedBy.some((u) => u.id === user.uid)

  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likedBy.length)
  const [loading, setLoading] = useState(false)

  const toggleLike = async () => {
    if (!user.uid) {
      toast.error('请登录以点赞')
      return
    }

    if (publisher.id === user.uid) {
      toast.error('您不能给自己点赞')
      return
    }

    setLoading(true)
    const res = await api.patch.toggleResourceLike.mutate({
      resourceId
    })
    setLoading(false)
    useErrorHandler(res, (value) => {
      setLiked(value)
      setLikeCount((prev) => (value ? prev + 1 : prev - 1))
    })
  }

  return (
    <Tooltip
      key="like"
      color="default"
      content={
        likedBy.length
          ? `${likedBy.map((u) => u.name).toString()} 点赞过`
          : '点赞'
      }
      placement="bottom"
    >
      <Button
        variant="light"
        disabled={loading}
        onClick={toggleLike}
        className="min-w-0 px-2"
      >
        <Heart
          className={cn(
            'w-4 h-4',
            liked ? 'text-danger-500' : 'text-default-500'
          )}
        />
        {likeCount}
      </Button>
    </Tooltip>
  )
}
