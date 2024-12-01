import { Comment } from '~/components/admin/comment/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { AdminComment } from '~/types/api/admin'

export default async function Kun() {
  const { comments, total } = await kunFetchGet<{
    comments: AdminComment[]
    total: number
  }>('/admin/comment', {
    page: 1,
    limit: 100
  })

  return <Comment initialComments={comments} total={total} />
}
