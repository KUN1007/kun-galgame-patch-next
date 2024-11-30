import { UserComment } from '~/components/user/comment/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { UserComment as UserCommentType } from '~/types/api/user'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { comments, total } = await kunFetchGet<{
    comments: UserCommentType[]
    total: number
  }>('/user/profile/comment', {
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserComment initComments={comments} total={total} uid={Number(id)} />
}
