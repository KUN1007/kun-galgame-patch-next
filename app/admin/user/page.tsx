import { serverApi } from '~/lib/trpc-server'
import { User } from '~/components/admin/user/Container'

export default async function Kun() {
  const { users, total } = await serverApi.admin.getUserInfo.query({
    page: 1,
    limit: 100
  })

  return <User initialUsers={users} total={total} />
}
