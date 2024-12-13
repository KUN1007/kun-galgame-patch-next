import { CardContainer } from '~/components/galgame/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams?: Promise<{ page?: number }>
}

export default async function Kun({ searchParams }: Props) {
  const res = await searchParams
  const currentPage = res?.page ? res.page : 1

  const { galgames, total } = await kunServerFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/galgame', {
    selectedType: 'all',
    sortField: 'created',
    sortOrder: 'desc',
    page: currentPage,
    limit: 24
  })

  return (
    <Suspense>
      <CardContainer initialGalgames={galgames} initialTotal={total} />
    </Suspense>
  )
}
