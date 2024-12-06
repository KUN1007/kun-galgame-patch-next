'use client'

import { Chip } from '@nextui-org/chip'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { useRouter } from 'next-nprogress-bar'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'

import type { UserResource as UserResourceType } from '~/types/api/user'

interface Props {
  resource: UserResourceType
}

export const UserResourceCard = ({ resource }: Props) => {
  const router = useRouter()

  return (
    <Card
      className="w-full"
      isPressable
      onPress={() => router.push(`/patch/${resource.patchId}/resource`)}
    >
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:h-auto sm:w-40">
            <Image
              src={resource.patchBanner.replace(/\.avif$/, '-mini.avif')}
              alt={resource.patchName}
              className="size-full max-h-52 rounded-lg object-cover"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="line-clamp-2 text-lg font-semibold transition-colors hover:text-primary-500">
                {resource.patchName}
              </h3>
              <Chip variant="flat">
                {formatDistanceToNow(resource.created)}
              </Chip>
            </div>

            <KunPatchAttribute
              types={resource.type}
              languages={resource.language}
              platforms={resource.platform}
              size="sm"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
