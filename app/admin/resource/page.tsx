import { Resource } from '~/components/admin/resource/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { AdminResource } from '~/types/api/admin'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { resources, total } = await kunServerFetchGet<{
    resources: AdminResource[]
    total: number
  }>('/admin/resource', {
    page: 1,
    limit: 100
  })

  return <Resource initialResources={resources} total={total} />
}
