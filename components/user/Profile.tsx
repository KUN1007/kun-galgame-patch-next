import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Button } from '@nextui-org/button'
import { Chip } from '@nextui-org/chip'
import { Divider } from '@nextui-org/divider'
import { Progress } from '@nextui-org/progress'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import {
  Plus,
  MessageCircle,
  Star,
  GitPullRequest,
  FileCode,
  Mail,
  Calendar,
  Link as LinkIcon
} from 'lucide-react'
import { UserActivity } from './Activity'
import type { UserInfo } from '~/types/api/user'

export const Profile = ({ user }: { user: UserInfo }) => {
  const stats = [
    { label: '补丁', value: user._count.patch, icon: FileCode },
    {
      label: '更新请求',
      value: user._count.patch_pull_request,
      icon: GitPullRequest
    },
    { label: '评论', value: user._count.patch_comment, icon: MessageCircle },
    { label: '收藏', value: user._count.patch_favorite, icon: Star }
  ]

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="w-full">
          <CardHeader className="justify-center pt-8">
            <div className="flex flex-col items-center gap-3">
              <Avatar
                src={user.avatar.replace('-mini', '')}
                className="w-32 h-32"
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
            <UserActivity />
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
