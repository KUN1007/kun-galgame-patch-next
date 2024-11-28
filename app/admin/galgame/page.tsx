import { serverApi } from '~/lib/trpc-server'
import { Galgame } from '~/components/admin/galgame/Container'

export default async function Kun() {
  const { galgames, total } = await serverApi.admin.getGalgame.query({
    page: 1,
    limit: 100
  })

  return <Galgame initialGalgames={galgames} total={total} />
}
