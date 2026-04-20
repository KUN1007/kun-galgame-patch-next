import { getPatchRanking } from '~/app/ranking/actions'
import { RankingContainer } from '~/components/ranking/Container'
import { PatchList } from '~/components/ranking/patch/PatchList'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams: Promise<{ sortBy?: string; timeRange?: string }>
}

export default async function Kun({ searchParams }: Props) {
  const res = await searchParams

  const sortBy = res.sortBy || 'view'
  const timeRange = res.timeRange || 'all'
  const patches = await getPatchRanking(sortBy, timeRange)

  return (
    <RankingContainer type="patch" sortBy={sortBy} timeRange={timeRange}>
      <PatchList patches={patches} />
    </RankingContainer>
  )
}
