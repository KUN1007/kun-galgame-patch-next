import { Creator } from '~/components/admin/creator/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { AdminCreator } from '~/types/api/admin'

export default async function Kun() {
  const { creators, total } = await kunFetchGet<{
    creators: AdminCreator[]
    total: number
  }>('/admin/creator', {
    page: 1,
    limit: 100
  })

  return <Creator initialCreators={creators} total={total} />
}
