'use client'

import { Card, CardBody } from '@nextui-org/card'
import { Chip } from '@nextui-org/chip'
import { User } from '@nextui-org/user'
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
          <User
            name={resource.user.name}
            description={`${formatDistanceToNow(resource.created)} • 已发布补丁 ${resource.user.patchCount} 个`}
            avatarProps={{
              showFallback: true,
              src: resource.user.avatar,
              name: resource.user.name.charAt(0).toUpperCase()
            }}
          />
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
