import { useState } from 'react'
import { kunFetchPut } from '~/utils/kunFetch'
import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { ThumbsUp } from 'lucide-react'
import { useUserStore } from '~/store/providers/user'
import toast from 'react-hot-toast'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import { cn } from '~/utils/cn'

interface Props {
  commentId: number
  likedBy: KunUser[]
  commenter: KunUser
}

export const CommentLikeButton = ({ commentId, likedBy, commenter }: Props) => {
  const { user } = useUserStore((state) => state)
  const isLiked = likedBy.some((u) => u.id === user.uid)

  const [liked, setLiked] = useState(isLiked)
  const [likeCount, setLikeCount] = useState(likedBy.length)
  const [loading, setLoading] = useState(false)

  const toggleLike = async () => {
    if (!user.uid) {
      toast.error('请登录以点赞')
      return
    }

    if (commenter.id === user.uid) {
      toast.error('您不能给自己点赞')
      return
    }

    setLoading(true)
    const res = await kunFetchPut<KunResponse<boolean>>(
      '/user/patch/comment/like',
      { commentId }
    )

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
        variant="ghost"
        size="sm"
        className="gap-2"
        disabled={loading}
        isLoading={loading}
        onClick={toggleLike}
      >
        <ThumbsUp className={cn('w-4 h-4', liked ? 'text-danger-500' : '')} />
        {likeCount}
      </Button>
    </Tooltip>
  )
}
