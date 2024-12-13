import { CardContainer } from '~/components/resource/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import type { PatchResource } from '~/types/api/resource'

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams?: Promise<{ page?: number }>
}

export default async function Kun({ searchParams }: Props) {
  const res = await searchParams
  const currentPage = res?.page ? res.page : 1

  const { resources, total } = await kunServerFetchGet<{
    resources: PatchResource[]
    total: number
  }>('/resource', {
    sortField: 'created',
    sortOrder: 'desc',
    page: currentPage,
    limit: 50
  })

  return (
    <Suspense>
      <CardContainer initialResources={resources} initialTotal={total} />
    </Suspense>
  )
}
