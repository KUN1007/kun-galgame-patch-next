import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { Divider } from '@nextui-org/divider'
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
          src={patch.banner}
          alt={patch.name}
          className="w-full max-h-[720px] h-[312px] object-cover"
        />
      </CardHeader>
      <CardBody className="px-0 py-4">
        <div className="flex flex-col items-start justify-between sm:flex-row">
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

        <div className="flex gap-6 text-sm">
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
