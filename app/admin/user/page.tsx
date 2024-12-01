import { kunFetchGet } from '~/utils/kunFetch'
import { User } from '~/components/admin/user/Container'
import type { AdminUser } from '~/types/api/admin'

export default async function Kun() {
  const { users, total } = await kunFetchGet<{
    users: AdminUser[]
    total: number
  }>('/admin/user', {
    page: 1,
    limit: 100
  })

  return <User initialUsers={users} total={total} />
}
