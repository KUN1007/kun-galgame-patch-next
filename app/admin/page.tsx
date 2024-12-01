import { Stats } from '~/components/admin/stats'
import { kunFetchGet } from '~/utils/kunFetch'
import type { AdminStats } from '~/types/api/admin'

export default async function Kun() {
  const stats = await kunFetchGet<AdminStats[]>('/admin/stats')

  return <Stats stats={stats} />
}
