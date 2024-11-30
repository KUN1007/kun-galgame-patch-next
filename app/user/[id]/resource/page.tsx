import { UserResource } from '~/components/user/resource/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { UserResource as UserResourceType } from '~/types/api/user'

export default async function Resource({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { resources, total } = await kunFetchGet<{
    resources: UserResourceType[]
    total: number
  }>('/user/profile/resource', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserResource resources={resources} total={total} uid={Number(id)} />
}
