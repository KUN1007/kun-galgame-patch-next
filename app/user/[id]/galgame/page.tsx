import { serverApi } from '~/lib/trpc-server'
import { UserGalgame } from '~/components/user/galgame/Container'

export default async function Galgame({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { galgames } = await serverApi.user.getUserGalgame.query({
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserGalgame galgames={galgames} uid={Number(id)} />
}
