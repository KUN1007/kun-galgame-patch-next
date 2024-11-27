import { serverApi } from '~/lib/trpc-server'
import { UserResource } from '~/components/user/resource/Container'

export default async function Resource({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { resources, total } = await serverApi.user.getUserPatchResource.query({
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserResource resources={resources} total={total} uid={Number(id)} />
}
