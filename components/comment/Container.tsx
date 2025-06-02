'use client'

import { useEffect, useState } from 'react'
import { Pagination } from '@heroui/pagination'
import { kunFetchGet } from '~/utils/kunFetch'
import { CommentCard } from './CommentCard'
import { FilterBar } from './FilterBar'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '~/components/kun/Loading'
import { KunHeader } from '../kun/Header'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SortDirection, SortOption } from './_sort'
import type { PatchComment } from '~/types/api/comment'

interface Props {
  initialComments: PatchComment[]
  initialTotal: number
}

export const CardContainer = ({ initialComments, initialTotal }: Props) => {
  const [comments, setComments] = useState<PatchComment[]>(initialComments)
  const [total, setTotal] = useState(initialTotal)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState<SortOption>('created')
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc')
  const isMounted = useMounted()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)

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

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
    setTimeout(() => {
      window.scrollTo(0, 0)
    })
    const params = new URLSearchParams(window.location.search)
    params.set('page', newPage.toString())
    router.push(`?${params.toString()}`)
  }

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
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} />
          ))}
        </div>
      )}

      {total > 50 && (
        <div className="flex justify-center">
          <Pagination
            total={Math.ceil(total / 50)}
            page={page}
            onChange={handlePageChange}
            showControls
            color="primary"
            size="lg"
          />
        </div>
      )}
    </div>
  )
}
