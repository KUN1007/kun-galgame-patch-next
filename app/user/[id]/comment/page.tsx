import { serverApi } from '~/lib/trpc-server'
import { UserComment } from '~/components/user/comment/Container'

export default async function Kun({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const { comments, total } = await serverApi.user.getUserComment.query({
    uid: Number(id),
    page: 1,
    limit: 20
  })

  return <UserComment initComments={comments} total={total} uid={Number(id)} />
}
