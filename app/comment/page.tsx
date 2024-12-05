import { CardContainer } from '~/components/comment/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { PatchComment } from '~/types/api/comment'

export default async function Kun() {
  const { comments } = await kunFetchGet<{
    comments: PatchComment[]
    total: number
  }>('/comment', {
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 50
  })

  return <CardContainer initialComments={comments} />
}
