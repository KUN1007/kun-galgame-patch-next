import { Resource } from '~/components/admin/resource/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { AdminResource } from '~/types/api/admin'

export default async function Kun() {
  const { resources, total } = await kunFetchGet<{
    resources: AdminResource[]
    total: number
  }>('/admin/resource', {
    page: 1,
    limit: 100
  })

  return <Resource initialResources={resources} total={total} />
}
