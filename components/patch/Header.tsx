import { Card, CardHeader, CardBody } from '@nextui-org/card'
import { Avatar } from '@nextui-org/avatar'
import { Chip } from '@nextui-org/chip'
import { Button } from '@nextui-org/button'
import { Divider } from '@nextui-org/divider'
import { Eye, Heart, MessageSquare, Share2, Puzzle } from 'lucide-react'
import { ResourceFavoriteButton } from './PatchFavorite'
import type { Patch } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
}

export const PatchHeader = ({ patch }: PatchHeaderProps) => {
  return (
    <Card>
      <CardHeader className="relative h-full p-0">
        <img
          src={patch.banner}
          alt={patch.name}
          className="w-full max-h-[720px] h-[312px] object-cover"
        />
      </CardHeader>
      <CardBody>
        <div className="flex flex-col items-start justify-between space-y-2 sm:flex-row">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{patch.name}</h1>
            <div className="flex flex-wrap gap-2">
              {patch.platform.length > 0 &&
                patch.platform.map((platform) => (
                  <Chip key={platform} variant="flat">
                    {platform}
                  </Chip>
                ))}

              {patch.language.length > 0 &&
                patch.language.map((language) => (
                  <Chip key={language} color="primary" variant="flat">
                    {language}
                  </Chip>
                ))}

              {patch.type.length > 0 &&
                patch.type.map((type) => (
                  <Chip key={type} color="primary" variant="solid">
                    {type}
                  </Chip>
                ))}
            </div>
          </div>
          <div className="flex gap-2 ml-auto">
            <ResourceFavoriteButton
              patchId={patch.id}
              isFavorite={patch.isFavorite}
            />
            <Button variant="bordered" isIconOnly>
              <Share2 className="w-4 h-4" />
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
            <Heart className="w-4 h-4" />
            <span>{patch._count.favorite_by || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Puzzle className="w-4 h-4" />
            <span>{patch._count.resource || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <MessageSquare className="w-4 h-4" />
            <span>{patch._count.comment || 0}</span>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
