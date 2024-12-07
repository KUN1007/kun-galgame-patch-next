import { CardContainer } from '~/components/galgame/Container'
import { kunFetchPost } from '~/utils/kunFetch'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { galgames } = await kunFetchPost<{
    galgames: GalgameCard[]
    total: number
  }>('/galgame', {
    selectedTypes: ['all'],
    sortField: 'created',
    sortOrder: 'desc',
    page: 1,
    limit: 24
  })

  return <CardContainer initialGalgames={galgames} />
}
