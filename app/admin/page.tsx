'use client'

import { Card, CardBody } from '@nextui-org/react'
import { Users, Puzzle, MessageSquare, Activity } from 'lucide-react'

const stats = [
  {
    title: '用户总数量',
    value: '1007',
    icon: Users,
    change: '+17%'
  },
  {
    title: '补丁总数量',
    value: '1007',
    icon: Puzzle,
    change: '+17%'
  },
  {
    title: '今日评论数',
    value: '1007',
    icon: MessageSquare,
    change: '+17%'
  },
  {
    title: '日活跃用户',
    value: '1007',
    icon: Activity,
    change: '+17%'
  }
]

export default function Kun() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">网站概览</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardBody>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-small text-default-500">{stat.title}</p>
                    <p className="text-2xl font-semibold">{stat.value}</p>
                    <p className="text-small text-success">{stat.change}</p>
                  </div>
                  <Icon size={24} className="text-default-400" />
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
