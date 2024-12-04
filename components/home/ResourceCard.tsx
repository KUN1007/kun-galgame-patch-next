'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Chip } from '@nextui-org/chip'
import { Avatar } from '@nextui-org/avatar'
import { Heart } from 'lucide-react'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'
import { useRouter } from 'next-nprogress-bar'
import type { HomeResource } from '~/types/api/home'

interface Props {
  resource: HomeResource
}

export const ResourceCard = ({ resource }: Props) => {
  const router = useRouter()

  return (
    <Card
      className="w-full"
      isPressable
      onPress={() => router.push(`/patch/${resource.patchId}/resource`)}
    >
      <CardBody className="space-y-2">
        <div className="flex justify-between">
          <div className="flex items-center gap-3">
            <Avatar
              src={resource.user.avatar}
              name={resource.user.name}
              size="sm"
              className="flex-shrink-0"
            />
            <div className="flex flex-col flex-grow">
              <p className="font-semibold text-small">{resource.user.name}</p>
              <p className="text-tiny text-default-500">
                {formatDistanceToNow(resource.created)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-small text-default-500">
            <div className="flex items-center gap-1">
              <Heart size={16} />
              {resource.likeCount}
            </div>
            <Chip size="sm" variant="flat">
              {resource.size}
            </Chip>
          </div>
        </div>

        <h4 className="font-bold text-large">{resource.patchName}</h4>

        {resource.note && (
          <p className="text-small text-default-500">{resource.note}</p>
        )}

        <KunPatchAttribute
          types={resource.type}
          languages={resource.language}
          platforms={resource.platform}
          size="sm"
        />
      </CardBody>
    </Card>
  )
}
