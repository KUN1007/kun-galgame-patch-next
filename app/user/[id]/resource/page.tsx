import { UserResource } from '~/components/user/resource/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { generateKunMetadataTemplate } from './metadata'
import type { Metadata } from 'next'
import type { UserInfo } from '~/types/api/user'
import type { UserResource as UserResourceType } from '~/types/api/user'

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
  const { resources } = await kunServerFetchGet<{
    resources: UserResourceType[]
    total: number
  }>('/user/profile/resource', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return generateKunMetadataTemplate(user, resources)
}

export default async function Kun({ params }: Props) {
  const { id } = await params

  const { resources, total } = await kunServerFetchGet<{
    resources: UserResourceType[]
    total: number
  }>('/user/profile/resource', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserResource resources={resources} total={total} uid={Number(id)} />
}
