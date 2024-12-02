import { UserFavorite } from '~/components/user/favorite/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { favorites, total } = await kunServerFetchGet<{
    favorites: GalgameCard[]
    total: number
  }>('/public/user/profile/favorite', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserFavorite favorites={favorites} total={total} uid={Number(id)} />
}
