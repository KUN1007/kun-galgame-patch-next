import { Comment } from '~/components/admin/comment/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import type { AdminComment } from '~/types/api/admin'

export default async function Kun() {
  const { comments, total } = await kunServerFetchGet<{
    comments: AdminComment[]
    total: number
  }>('/admin/comment', {
    page: 1,
    limit: 100
  })

  return <Comment initialComments={comments} total={total} />
}
