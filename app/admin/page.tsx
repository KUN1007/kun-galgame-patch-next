import { Stats } from '~/components/admin/stats'
import { serverApi } from '~/lib/trpc-server'

export default async function Kun() {
  const stats = await serverApi.admin.getAdminStats.query()

  return <Stats stats={stats} />
}
