'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Button,
  Chip,
  Divider,
  Progress,
  Tab,
  Tabs,
  Badge
} from '@nextui-org/react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import {
  Plus,
  MessageCircle,
  Star,
  GitPullRequest,
  FileCode,
  Mail,
  Calendar,
  MapPin,
  Link as LinkIcon
} from 'lucide-react'
import { api } from '~/lib/trpc-client'
import { useErrorHandler } from '~/hooks/useErrorHandler'
import type { UserInfo } from '~/types/api/user'

export const Profile = ({ id }: { id: number }) => {
  const [user, setUser] = useState<UserInfo>()
  const [stats, setStats] = useState([
    { label: '补丁', value: 0, icon: FileCode },
    { label: '更新请求', value: 0, icon: GitPullRequest },
    { label: '评论', value: 0, icon: MessageCircle },
    { label: '收藏', value: 0, icon: Star }
  ])

  useEffect(() => {
    const fetchPatchHistories = async () => {
      const res = await api.user.getProfile.query({ id: Number(id) })
      useErrorHandler(res, (value) => {
        setUser(value)
        setStats((prevStats) => [
          { ...prevStats[0], value: value._count.patch },
          { ...prevStats[1], value: value._count.patch_pull_request },
          { ...prevStats[2], value: value._count.patch_comment },
          { ...prevStats[3], value: value._count.patch_favorite }
        ])
      })
    }
    fetchPatchHistories()
  }, [id])

  if (!user) {
    return '加载中'
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="w-full">
          <CardHeader className="justify-center pt-8">
            <div className="flex flex-col items-center gap-3">
              <Avatar
                src={user.avatar}
                className="w-24 h-24"
                isBordered
                color="primary"
              />
              <div className="flex flex-col items-center gap-1">
                <h4 className="text-2xl font-bold">{user.name}</h4>
                <Chip color="primary" variant="flat" size="sm" className="mt-1">
                  {user.role}
                </Chip>
              </div>
            </div>
          </CardHeader>
          <CardBody className="px-6 py-4">
            {user.bio && (
              <p className="mb-6 text-center text-default-600">{user.bio}</p>
            )}
            <div className="flex flex-col gap-4">
              {/* <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-default-400" />
                <span className="text-small text-default-500">
                  {user.location}
                </span>
              </div> */}
              <div className="flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-default-400" />
                <a
                  href={`https://www.moyu.moe/user/${user.id}`}
                  className="text-small text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {`https://www.moyu.moe/user/${user.id}`}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-default-400" />
                <span className="text-small text-default-500">
                  加入于 {formatDistanceToNow(user.registerTime)}
                </span>
              </div>
            </div>
            <Divider className="my-4" />
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-small">萌萌点</span>
                  <span className="text-small text-default-500">
                    {user.moemoepoint}
                  </span>
                </div>
                <Progress
                  aria-label="moemoepoint"
                  value={user.moemoepoint / 20}
                  color="primary"
                  className="h-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  startContent={<Plus className="w-4 h-4" />}
                  color="primary"
                  variant="flat"
                  fullWidth
                >
                  关注
                </Button>
                <Button
                  startContent={<Mail className="w-4 h-4" />}
                  color="default"
                  variant="flat"
                  fullWidth
                >
                  Message
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="w-full">
              <CardBody className="flex flex-row items-center gap-4 p-4">
                <stat.icon className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-small text-default-500">{stat.label}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="w-full">
          <CardBody>
            <Tabs aria-label="User activity" variant="underlined" fullWidth>
              <Tab key="patches" title="补丁">
                <div className="p-4">
                  <p className="text-default-500">补丁</p>
                </div>
              </Tab>
              <Tab key="resources" title="资源">
                <div className="p-4">
                  <p className="text-default-500">资源</p>
                </div>
              </Tab>
              <Tab key="contributions" title="贡献">
                <div className="p-4">
                  <p className="text-default-500">贡献</p>
                </div>
              </Tab>
              <Tab key="comments" title="评论">
                <div className="p-4">
                  <p className="text-default-500">评论</p>
                </div>
              </Tab>
              <Tab key="favorite" title="收藏">
                <div className="p-4">
                  <p className="text-default-500">收藏</p>
                </div>
              </Tab>
            </Tabs>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
