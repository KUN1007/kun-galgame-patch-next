import { Card, CardBody } from '@nextui-org/card'
import { Users, Puzzle, MessageSquare, Activity } from 'lucide-react'
import type { AdminStats } from '~/types/api/admin'

interface Props {
  stats: AdminStats[]
}

const formatStats = (stats: AdminStats[]) => {
  const result = stats.map((item) => {
    let icon
    let title

    switch (item.title) {
      case 'user':
        title = '用户总数量'
        icon = Users
        break
      case 'patch':
        title = '补丁总数量'
        icon = Puzzle
        break
      case 'comment':
        title = '今日评论数'
        icon = MessageSquare
        break
      case 'active':
        title = '日活跃用户'
        icon = Activity
        break
      default:
        title = item.title
        icon = null
    }

    return {
      title,
      value: item.value,
      icon,
      change: item.change
    }
  })

  return result
}

export const Stats = ({ stats }: Props) => {
  const result = formatStats(stats)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">网站概览</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {result.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-small text-default-500">{stat.title}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-small text-success">
                      {stat.change > 0 ? '+' : '-'}
                      {stat.change}
                    </p>
                  </div>
                  {Icon && <Icon size={24} className="text-default-400" />}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}