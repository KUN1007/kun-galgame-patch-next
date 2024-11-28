import { serverApi } from '~/lib/trpc-server'
import { Resource } from '~/components/admin/resource/Container'

export default async function Kun() {
  const { resources, total } = await serverApi.admin.getPatchResource.query({
    page: 1,
    limit: 100
  })

  return <Resource initialResources={resources} total={total} />
}
