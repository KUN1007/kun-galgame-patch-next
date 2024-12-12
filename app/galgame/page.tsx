import { CardContainer } from '~/components/galgame/Container'
import { kunServerFetchGet } from '~/utils/kunServerFetch'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { galgames, total } = await kunServerFetchGet<{
    galgames: GalgameCard[]
    total: number
  }>('/galgame', {
    selectedType: 'all',
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 24
  })

  return <CardContainer initialGalgames={galgames} initialTotal={total} />
}
