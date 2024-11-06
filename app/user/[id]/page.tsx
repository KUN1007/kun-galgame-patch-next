'use client'

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
  Heart,
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

const mockUser = {
  id: 1,
  name: '鲲',
  email: 'kun@moyu.moe',
  avatar: '	https://image.kungal.com/avatar/user_2/avatar.webp',
  role: 'ADMIN',
  status: 1,
  register_time: Date.now(),
  moemoepoint: 1250,
  bio: '🚀 Full-stack developer',
  like: 423,
  daily_image_count: 5,
  daily_check_in: 15,
  location: 'Tokyo, Japan',
  website: 'https://moyu.moe'
}

interface UserInfo {
  id: number
  name: string
  email: string
  avatar: string
  bio: string
  role: string
  status: number
  registerTime: string
  moemoepoint: number
  like: number
}

const stats = [
  { label: 'Patches', value: 156, icon: FileCode },
  { label: 'Pull Requests', value: 28, icon: GitPullRequest },
  { label: 'Comments', value: 342, icon: MessageCircle },
  { label: 'Favorites', value: 89, icon: Star }
]

export default function Home() {
  const [histories, setHistories] = useState<PatchHistory[]>([])

  useEffect(() => {
    const fetchPatchHistories = async () => {
      const res = await api.patch.getPatchHistories.query({
        patchId: Number(id)
      })
      setHistories(res)
    }
    fetchPatchHistories()
  }, [])

  return (
    <div className="w-full py-8 mx-auto">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card className="w-full">
            <CardHeader className="justify-center pt-8">
              <div className="flex flex-col items-center gap-3">
                <Badge
                  content=""
                  color="success"
                  shape="circle"
                  placement="bottom-right"
                >
                  <Avatar
                    src={mockUser.avatar}
                    className="w-24 h-24"
                    isBordered
                    color="primary"
                  />
                </Badge>
                <div className="flex flex-col items-center gap-1">
                  <h4 className="text-2xl font-bold">{mockUser.name}</h4>
                  <p className="text-small text-default-500">
                    {mockUser.email}
                  </p>
                  <Chip
                    color="primary"
                    variant="flat"
                    size="sm"
                    className="mt-1"
                  >
                    {mockUser.role}
                  </Chip>
                </div>
              </div>
            </CardHeader>
            <CardBody className="px-6 py-4">
              <p className="mb-6 text-center text-default-600">
                {mockUser.bio}
              </p>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-default-400" />
                  <span className="text-small text-default-500">
                    {mockUser.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-default-400" />
                  <a
                    href={mockUser.website}
                    className="text-small text-primary hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {mockUser.website}
                  </a>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-default-400" />
                  <span className="text-small text-default-500">
                    Joined {formatDistanceToNow(mockUser.register_time)}
                  </span>
                </div>
              </div>
              <Divider className="my-4" />
              <div className="flex flex-col gap-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-small">MoeMoe Points</span>
                    <span className="text-small text-default-500">
                      {mockUser.moemoepoint}
                    </span>
                  </div>
                  <Progress
                    aria-label="moemoepoint"
                    value={mockUser.moemoepoint / 20}
                    color="primary"
                    className="h-2"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    startContent={<Heart className="w-4 h-4" />}
                    color="primary"
                    variant="flat"
                    fullWidth
                  >
                    Like
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
            <CardBody className="p-0">
              <Tabs aria-label="User activity">
                <Tab key="patches" title="Recent Patches">
                  <div className="p-4">
                    <p className="text-default-500">No recent patches</p>
                  </div>
                </Tab>
                <Tab key="contributions" title="Contributions">
                  <div className="p-4">
                    <p className="text-default-500">No contributions yet</p>
                  </div>
                </Tab>
                <Tab key="activity" title="Activity">
                  <div className="p-4">
                    <p className="text-default-500">No recent activity</p>
                  </div>
                </Tab>
              </Tabs>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  )
}
