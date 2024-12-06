import { UserGalgame } from '~/components/user/galgame/Container'
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
  const { galgames } = await kunServerFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/user/profile/galgame', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return generateKunMetadataTemplate(user, galgames)
}

export default async function Kun({ params }: Props) {
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
