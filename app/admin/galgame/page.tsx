import { Galgame } from '~/components/admin/galgame/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { AdminGalgame } from '~/types/api/admin'

export default async function Kun() {
  const { galgames, total } = await kunFetchGet<{
    galgames: AdminGalgame[]
    total: number
  }>('/admin/galgame', {
    page: 1,
    limit: 100
  })

  return <Galgame initialGalgames={galgames} total={total} />
}
