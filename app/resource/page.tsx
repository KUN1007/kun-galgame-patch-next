import { CardContainer } from '~/components/resource/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'
import type { PatchResource } from '~/types/api/resource'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { resources, total } = await kunServerFetchGet<{
    resources: PatchResource[]
    total: number
  }>('/resource', {
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 50
  })

  return <CardContainer initialResources={resources} initialTotal={total} />
}
