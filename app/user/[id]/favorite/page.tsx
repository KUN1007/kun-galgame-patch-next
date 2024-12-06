import { UserFavorite } from '~/components/user/favorite/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'

interface Props {
  params: Promise<{ id: string }>
}

export const generateMetadata = async ({
  params
}: Props): Promise<Metadata> => {
  const { id } = await params
  const user = await kunServerFetchGet<UserInfo>('/user/status/info', {
    id: Number(id)
  })
  const { favorites } = await kunServerFetchGet<{
    favorites: GalgameCard[]
    total: number
  }>('/user/profile/favorite', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return generateKunMetadataTemplate(user, favorites)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const { favorites, total } = await kunServerFetchGet<{
    favorites: GalgameCard[]
    total: number
  }>('/user/profile/favorite', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserFavorite favorites={favorites} total={total} uid={Number(id)} />
}
