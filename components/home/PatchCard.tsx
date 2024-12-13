import Link from 'next/link'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { KunCardStats } from '~/components/kun/CardStats'

interface Props {
  patch: GalgameCard
}

export const PatchCard = ({ patch }: Props) => {
  return (
    <Card
      isPressable
      as={Link}
      href={`/patch/${patch.id}/introduction`}
      className="w-full"
    >
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:w-40">
            <Image
              removeWrapper
              src={patch.banner.replace(/\.avif$/, '-mini.avif')}
              alt={patch.name}
              className="object-cover rounded-lg size-full"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
              {patch.name}
            </h2>

            <KunCardStats patch={patch} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
