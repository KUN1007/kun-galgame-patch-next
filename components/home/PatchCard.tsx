'use client'

import { useRouter } from 'next-nprogress-bar'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { KunCardStats } from '~/components/kun/CardStats'

interface Props {
  patch: GalgameCard
}

export const PatchCard = ({ patch }: Props) => {
  const router = useRouter()

  return (
    <Card
      className="w-full"
      isPressable
      onPress={() => router.push(`/patch/${patch.id}/introduction`)}
    >
      <CardBody className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative w-full sm:w-40">
            <Image
              src={patch.banner.replace(/\.avif$/, '-mini.avif')}
              alt={patch.name}
              className="size-full rounded-lg object-cover"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="line-clamp-2 text-lg font-semibold transition-colors hover:text-primary-500">
              {patch.name}
            </h3>

            <KunCardStats patch={patch} />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
