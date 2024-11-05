import {
  Avatar,
  Chip,
  Divider,
  Button,
  Card,
  CardHeader,
  CardBody
} from '@nextui-org/react'
import { Eye, Heart, MessageSquare, Share2, Star, User } from 'lucide-react'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const PatchHeader = ({ patch }: PatchHeaderProps) => {
  return (
    <Card className="border-none shadow-none">
      <CardHeader className="relative h-[312px] p-0">
        <img
          src="/bg1.webp"
          alt="鲲 Galgame 补丁"
          className="w-full h-[312px] object-cover"
        />
      </CardHeader>
      <CardBody className="px-6 py-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{patch.name}</h1>
            <div className="flex flex-wrap gap-2">
              {patch.type.map((type) => (
                <Chip key={type} variant="flat">
                  {type}
                </Chip>
              ))}
              <Chip color="primary" variant="solid">
                {patch.language}
              </Chip>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="bordered" isIconOnly>
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="bordered" isIconOnly>
              <Star className="w-4 h-4" />
            </Button>
            <Button variant="bordered" isIconOnly>
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Divider className="my-4" />

        <div className="flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Avatar
              showFallback
              name={patch.user.name.charAt(0).toUpperCase()}
              src={patch.user.avatar}
            />
            <span>{patch.user.name}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span>{patch.view}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4" />
            <span>{patch._count?.like_by || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4" />
            <span>{patch._count?.favorite_by || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{patch._count?.comment || 0}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
