'use client'

import { Pagination } from '@nextui-org/react'
import { useState, useEffect } from 'react'
import { kunFetchGet } from '~/utils/kunFetch'
import { KunLoading } from '~/components/kun/Loading'
import { useMounted } from '~/hooks/useMounted'
import { CommentCard } from './Card'
import type { AdminComment } from '~/types/api/admin'

interface Props {
  initialComments: AdminComment[]
  total: number
}

export const Comment = ({ initialComments, total }: Props) => {
  const [comments, setComments] = useState<AdminComment[]>(initialComments)
  const [page, setPage] = useState(1)
  const isMounted = useMounted()

  const [loading, setLoading] = useState(false)
  const fetchData = async () => {
    setLoading(true)

    const { comments } = await kunFetchGet<{
      comments: AdminComment[]
      total: number
    }>('/admin/resource', {
      page,
      limit: 100
    })

    setLoading(false)
    setComments(comments)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchData()
  }, [page])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">评论管理</h1>

      <div className="space-y-4">
        {loading ? (
          <KunLoading hint="正在获取评论数据..." />
        ) : (
          <>
            {comments.map((comment) => (
              <CommentCard key={comment.id} comment={comment} />
            ))}
          </>
        )}
      </div>

      <div className="flex justify-center">
        <Pagination
          total={Math.ceil(total / 100)}
          page={page}
          onChange={setPage}
          color="primary"
          showControls
        />
      </div>
    </div>
  )
}
