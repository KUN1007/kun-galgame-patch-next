import { Chip } from '@nextui-org/chip'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import type { UserResource as UserResourceType } from '~/types/api/user'

interface Props {
  resource: UserResourceType
}

export const UserResourceCard = ({ resource }: Props) => {
  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:w-40 sm:h-auto">
            <Image
              src={resource.patchBanner.replace(/\.avif$/, '-mini.avif')}
              alt={resource.patchName}
              className="object-cover w-full h-full rounded-lg max-h-52"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-xl font-semibold line-clamp-2">
                {resource.patchName}
              </h3>
              <Chip variant="flat">
                {formatDistanceToNow(resource.created)}
              </Chip>
            </div>

            <div className="flex flex-wrap gap-2">
              {resource.type.map((type) => (
                <Chip
                  key={type}
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="text-xs"
                >
                  {type}
                </Chip>
              ))}
              {resource.platform.map((platform) => (
                <Chip
                  key={platform}
                  size="sm"
                  color="secondary"
                  variant="flat"
                  className="text-xs"
                >
                  {platform}
                </Chip>
              ))}
              {resource.language.map((lang) => (
                <Chip
                  key={lang}
                  size="sm"
                  color="success"
                  variant="flat"
                  className="text-xs"
                >
                  {lang}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
