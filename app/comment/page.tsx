import { CardContainer } from '~/components/comment/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import { Suspense } from 'react'
import type { PatchComment } from '~/types/api/comment'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams?: Promise<{ page?: number }>
}

export default async function Kun({ searchParams }: Props) {
  const res = await searchParams
  const currentPage = res?.page ? res.page : 1

  const { comments, total } = await kunServerFetchGet<{
    comments: PatchComment[]
    total: number
  }>('/comment', {
    sortField: 'created',
    sortOrder: 'desc',
    page: currentPage,
    limit: 50
  })

  return (
    <Suspense>
      <CardContainer initialComments={comments} initialTotal={total} />
    </Suspense>
  )
}
