import { UserContribute } from '~/components/user/contribute/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { UserContribute as UserContributeType } from '~/types/api/user'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { contributes, total } = await kunFetchGet<{
    contributes: UserContributeType[]
    total: number
  }>('/user/profile/contribute', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return (
    <UserContribute contributes={contributes} total={total} uid={Number(id)} />
  )
}
