import { CardContainer } from '~/components/galgame/Container'
import { kunFetchPost } from '~/utils/kunFetch'

export default async function Kun() {
  const { galgames } = await kunFetchPost<{
    galgames: GalgameCard[]
    total: number
  }>('/public/galgame', {
    selectedTypes: ['全部类型'],
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 24
  })

  return <CardContainer initialGalgames={galgames} />
}
