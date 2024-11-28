import { serverApi } from '~/lib/trpc-server'
import { AdminUser } from '~/components/admin/user/Container'

export default async function Kun() {
  const { users, total } = await serverApi.admin.getUserInfo.query({
    page: 1,
    limit: 100
  })

  return <AdminUser initialUsers={users} total={total} />
}
