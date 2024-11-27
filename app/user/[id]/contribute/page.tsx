import { serverApi } from '~/lib/trpc-server'
import { UserContribute } from '~/components/user/contribute/Container'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { contributes, total } = await serverApi.user.getUserContribute.query({
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return (
    <UserContribute contributes={contributes} total={total} uid={Number(id)} />
  )
}
