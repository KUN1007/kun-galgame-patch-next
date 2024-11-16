import { serverApi } from '~/lib/trpc-server'
import { CardContainer } from '~/components/galgame/Container'

export default async function PatchComment() {
  const patches = await serverApi.galgame.getGalgame.mutate({
    selectedTypes: ['全部类型'],
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 24
  })

  return <CardContainer patch={patches.data} />
}
