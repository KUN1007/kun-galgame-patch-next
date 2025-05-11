import { getUserRanking } from '~/app/ranking/actions'
import { RankingContainer } from '~/components/ranking/Container'
import { UserList } from '~/components/ranking/user/UserList'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

interface Props {
  searchParams: Promise<{ sortBy?: string; timeRange?: string }>
}

export default async function Kun({ searchParams }: Props) {
  const res = await searchParams

  const sortBy = res.sortBy || 'moemoepoint'
  const timeRange = res.timeRange || 'all'
  const users = await getUserRanking(sortBy)

  return (
    <RankingContainer type="user" sortBy={sortBy} timeRange={timeRange}>
      <UserList users={users} sortBy={sortBy} />
    </RankingContainer>
  )
}
