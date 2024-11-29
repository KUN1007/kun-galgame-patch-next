import { serverApi } from '~/lib/trpc-server'
import { Creator } from '~/components/admin/creator/Container'

export default async function Kun() {
  const { creators, total } = await serverApi.admin.getCreator.query({
    page: 1,
    limit: 100
  })

  return <Creator initialCreators={creators} total={total} />
}
