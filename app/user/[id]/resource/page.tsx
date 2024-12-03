import { UserResource } from '~/components/user/resource/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { UserResource as UserResourceType } from '~/types/api/user'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { resources, total } = await kunServerFetchGet<{
    resources: UserResourceType[]
    total: number
  }>('/user/profile/resource', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserResource resources={resources} total={total} uid={Number(id)} />
}
