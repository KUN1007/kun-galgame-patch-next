'use client'

import { useState, useEffect } from 'react'
import { api } from '~/lib/trpc-client'
import { Pagination } from '@nextui-org/pagination'
import { useMounted } from '~/hooks/useMounted'
import { KunNull } from '~/components/kun/Null'
import { KunLoading } from '~/components/kun/Loading'
import { UserCommentCard } from './Card'
import type { UserComment as UserCommentType } from '~/types/api/user'

interface Props {
  initComments: UserCommentType[]
  total: number
  uid: number
}

export const UserComment = ({ initComments, total, uid }: Props) => {
  const isMounted = useMounted()
  const [comments, setComments] = useState<UserCommentType[]>(initComments)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)

  const fetchPatches = async () => {
    setLoading(true)
    const response = await api.user.getUserComment.query({
      uid,
      page,
      limit: 20
    })
    setComments(response.comments)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchPatches()
  }, [page])

  return (
    <div className="space-y-4">
      {loading ? (
        <KunLoading hint="正在获取评论数据..." />
      ) : (
        <>
          {comments.map((com) => (
            <UserCommentCard key={com.id} comment={com} />
          ))}
        </>
      )}

      {!total && <KunNull message="这个孩子还没有发布过评论哦" />}

      {total > 24 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 24)}
            page={page}
            onChange={(newPage: number) => setPage(newPage)}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
