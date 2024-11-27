import { serverApi } from '~/lib/trpc-server'
import { UserFavorite } from '~/components/user/favorite/Container'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { favorites, total } = await serverApi.user.getUserFavorite.query({
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserFavorite favorites={favorites} total={total} uid={Number(id)} />
}
