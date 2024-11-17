import { Chip } from '@nextui-org/chip'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { KunCardStats } from '~/components/kun/CardStats'

interface Props {
  galgame: GalgameCard
}

export const UserGalgameCard = ({ galgame }: Props) => {
  return (
    <Card className="w-full">
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:w-40 sm:h-auto">
            <Image
              src={galgame.banner.replace(/\.avif$/, '-mini.avif')}
              alt={galgame.name}
              className="object-cover w-full h-full rounded-lg max-h-52"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <h3 className="text-xl font-semibold line-clamp-2">
                {galgame.name}
              </h3>
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
                  {type}
                </Chip>
              ))}
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
