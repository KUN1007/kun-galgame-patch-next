import { serverApi } from '~/lib/trpc-server'
import { Comment } from '~/components/admin/comment/Container'

export default async function Kun() {
  const { comments, total } = await serverApi.admin.getComment.query({
    page: 1,
    limit: 100
  })

  return <Comment initialComments={comments} total={total} />
}
