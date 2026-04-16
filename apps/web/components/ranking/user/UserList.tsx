'use client'

import { UserCard } from './UserCard'
import type { RankingUser } from '~/types/api/ranking'

interface Props {
  users: RankingUser[]
  sortBy?: string
}

export const UserList = ({
  users,
  sortBy = 'moemoepoint_increment'
}: Props) => {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {users.map((user, index) => (
        <UserCard key={user.id} user={user} rank={index + 1} sortBy={sortBy} />
      ))}
    </div>
  )
}
