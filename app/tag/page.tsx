import { Container } from '~/components/tag/Container'
import { kunFetchGet } from '~/utils/kunFetch'
import type { Tag } from '~/types/api/tag'

export default async function Kun() {
  const { tags } = await kunFetchGet<{
    tags: Tag[]
    total: number
  }>('/tag/all', {
    page: 1,
    limit: 100
  })
  return <Container initialTags={tags} />
}
