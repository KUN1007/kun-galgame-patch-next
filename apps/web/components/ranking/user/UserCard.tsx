'use client'

import { Avatar } from '@heroui/avatar'
import { Card, CardBody } from '@heroui/card'
import { Badge } from '@heroui/badge'
import { Download, MessageCircle, Puzzle, Lollipop } from 'lucide-react'
import Link from 'next/link'
import type { RankingUser } from '~/types/api/ranking'

export const UserCard = ({
  user,
  rank,
  sortBy
}: {
  user: RankingUser
  rank: number
  sortBy: string
}) => {
  const getMainStat = () => {
    switch (sortBy) {
      case 'patch':
        return {
          icon: <Puzzle className="size-4" />,
          value: user.patchCount,
          label: 'Galgame'
        }
      case 'resource':
        return {
          icon: <Download className="size-4" />,
          value: user.resourceCount,
          label: '补丁资源'
        }
      case 'comment':
        return {
          icon: <MessageCircle className="size-4" />,
          value: user.commentCount,
          label: '评论'
        }
      default:
        return {
          icon: <Lollipop className="size-4" />,
          value: user.moemoepoint,
          label: '萌萌点'
        }
    }
  }

  const mainStat = getMainStat()

  return (
    <Card isPressable as={Link} href={`/user/${user.id}/resource`}>
      <CardBody className="gap-3 scrollbar-hide">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Badge color="primary" size="lg" content={rank}>
              <Avatar
                src={user.avatar}
                className="w-16 h-16 text-large"
                isBordered
                color="secondary"
                name={user.name}
              />
            </Badge>
          </div>
          <div className="flex flex-col gap-1">
            <h3 className="text-lg font-bold truncate">{user.name}</h3>

            <div className="flex items-center gap-2">
              {mainStat.icon}
              <span>
                {mainStat.label}: {mainStat.value}
              </span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
