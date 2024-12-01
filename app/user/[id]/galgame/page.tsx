import { UserGalgame } from '~/components/user/galgame/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'

export default async function Galgame({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { galgames, total } = await kunServerFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/user/profile/galgame', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserGalgame galgames={galgames} total={total} uid={Number(id)} />
}
