import { Stats } from '~/components/admin/stats'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { AdminStats } from '~/types/api/admin'

export default async function Kun() {
  const stats = await kunServerFetchGet<AdminStats[]>('/admin/stats')

  return <Stats stats={stats} />
}
