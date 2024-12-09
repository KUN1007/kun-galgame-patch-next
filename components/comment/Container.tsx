'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@nextui-org/pagination'
import { kunFetchGet } from '~/utils/kunFetch'
import { CommentCard } from './CommentCard'
import { KunMasonryGrid } from '~/components/kun/MasonryGrid'
import { FilterBar } from './FilterBar'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { KunHeader } from '../kun/Header'
import type { SortDirection, SortOption } from './_sort'
import type { PatchComment } from '~/types/api/comment'

interface Props {
  initialComments: PatchComment[]
}

export const CardContainer = ({ initialComments }: Props) => {
  const [comments, setComments] = useState<PatchComment[]>(initialComments)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortOption>('created')
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc')
  const isMounted = useMounted()
  const [page, setPage] = useState(1)

  const fetchData = async () => {
    setLoading(true)

    const { comments } = await kunFetchGet<{
      comments: PatchComment[]
      total: number
    }>('/comment', {
      sortField,
      sortOrder,
      page,
      limit: 50
    })

    setComments(comments)
    setTotal(total)
    setLoading(false)
  }

  useEffect(() => {
    if (!isMounted) {
      return
    }
    fetchData()
  }, [sortField, sortOrder, page])

  return (
    <div className="container mx-auto my-4 space-y-6">
      <KunHeader
        name="Galgame 评论"
        description="这里展示了所有的 Galgame 评论"
      />

      <FilterBar
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
      />

      {loading ? (
        <KunLoading hint="正在获取评论数据..." />
      ) : (
        <KunMasonryGrid columnWidth={256} gap={24}>
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </KunMasonryGrid>
      )}

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
