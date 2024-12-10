'use client'

import { useRouter } from 'next-nprogress-bar'
import { Card, CardBody } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { KunCardStats } from '~/components/kun/CardStats'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'

interface Props {
  patch: GalgameCard
}

export const SearchCard = ({ patch }: Props) => {
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
              className="object-cover rounded-lg size-full"
              radius="lg"
            />
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
              {patch.name}
            </h2>

            <KunCardStats patch={patch} />

            <KunPatchAttribute
              types={patch.type}
              languages={patch.language}
              platforms={patch.platform}
              size="sm"
            />
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
