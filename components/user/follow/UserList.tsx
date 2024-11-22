'use client'

import { Avatar, Button, Card, CardBody } from '@nextui-org/react'
import { Plus, Users, UserMinus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '~/lib/trpc-client'
import type { UserFollow } from '~/types/api/user'

interface UserListProps {
  userId: number
  type: 'followers' | 'following'
}

export const UserList = ({ userId, type }: UserListProps) => {
  const [users, setUsers] = useState<UserFollow[]>([])

  const getUsers = async () => {
    const users = await api.user.getUserFollower.query({
      uid: userId
    })
    setUsers(users)
  }

  useEffect(() => {
    getUsers()
  }, [])

  return (
    <div className="flex flex-col gap-4">
      {users.map((user) => (
        <Card key={user.id}>
          <CardBody className="flex flex-row items-center gap-4">
            <Avatar src={user.avatar} className="w-12 h-12" />
            <div className="flex-grow">
              <h4 className="text-lg font-semibold">{user.name}</h4>
              <p className="text-small text-default-500">{user.bio}</p>

              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-default-400" />
                {user.follower} 人关注TA - {user.following} 正在关注
              </div>
            </div>
            <Button
              isIconOnly
              variant="light"
              className="text-default-900 data-[hover]:bg-default-100"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
