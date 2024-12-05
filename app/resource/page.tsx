import { CardContainer } from '~/components/resource/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { PatchResource } from '~/types/api/resource'

export default async function Kun() {
  const { resources } = await kunFetchGet<{
    resources: PatchResource[]
    total: number
  }>('/resource', {
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 50
  })

  return <CardContainer initialResources={resources} />
}
