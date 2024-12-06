import { UserContribute } from '~/components/user/contribute/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'
import type { UserContribute as UserContributeType } from '~/types/api/user'

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
  const { contributes } = await kunServerFetchGet<{
    contributes: UserContributeType[]
    total: number
  }>('/user/profile/contribute', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return generateKunMetadataTemplate(user, contributes)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const { contributes, total } = await kunServerFetchGet<{
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
