import { Chip } from '@heroui/chip'
import { Card, CardBody } from '@heroui/card'
import { Image } from '@heroui/image'
import Link from 'next/link'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunCardStats } from '~/components/kun/CardStats'
import { SUPPORTED_TYPE_MAP } from '~/constants/resource'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'

interface Props {
  galgame: GalgameCard
}

export const UserGalgameCard = ({ galgame }: Props) => {
  const galgameName = getPreferredLanguageText(galgame.name)

  return (
    <Card
      isPressable
      as={Link}
      href={`/patch/${galgame.id}/introduction`}
      target="_blank"
      className="w-full"
    >
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:h-auto sm:w-40">
            <Image
              src={
                galgame.banner
                  ? galgame.banner.replace(/\.avif$/, '-mini.avif')
                  : '/kungalgame.avif'
              }
              alt={galgameName}
              className="object-cover rounded-lg size-full max-h-52"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h2 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
                {galgameName}
              </h2>
              <Chip variant="flat">{formatDistanceToNow(galgame.created)}</Chip>
            </div>

            <KunCardStats patch={galgame} />

            <div className="flex flex-wrap gap-2">
              {galgame.type.map((type) => (
                <Chip
                  key={type}
                  size="sm"
                  color="primary"
                  variant="flat"
                  className="text-xs"
                >
                  {SUPPORTED_TYPE_MAP[type]}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
