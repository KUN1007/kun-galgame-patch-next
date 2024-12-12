'use client'

import { Card, CardBody, CardFooter, CardHeader } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { KunCardStats } from '~/components/kun/CardStats'
import { useRouter } from 'next-nprogress-bar'
import { useState } from 'react'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'

interface Props {
  patch: GalgameCard
}

export const GalgameCard = ({ patch }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const router = useRouter()

  return (
    <Card
      className="w-full"
      isPressable
      onPress={() => router.push(`/patch/${patch.id}/introduction`)}
    >
      <CardHeader className="p-0">
        <div className="relative w-full mx-auto overflow-hidden text-center rounded-t-lg opacity-90">
          <div
            className={`absolute inset-0 animate-pulse bg-default-100 ${
              imageLoaded ? 'opacity-0' : 'opacity-90'
            } transition-opacity duration-300`}
            style={{ aspectRatio: '16/9' }}
          />
          <Image
            alt={patch.name}
            className={`size-full object-cover transition-all duration-300 ${
              imageLoaded ? 'scale-100 opacity-90' : 'scale-105 opacity-0'
            }`}
            removeWrapper={true}
            src={patch.banner.replace(/\.avif$/, '-mini.avif')}
            style={{ aspectRatio: '16/9' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </CardHeader>
      <CardBody className="px-4 py-2 space-y-3">
        <h2 className="text-lg font-semibold transition-colors line-clamp-2 hover:text-primary-500">
          {patch.name}
        </h2>
        <KunCardStats patch={patch} />
      </CardBody>
      <CardFooter className="flex-col items-start gap-2 px-4 py-3">
        <KunPatchAttribute
          types={patch.type}
          languages={patch.language}
          platforms={patch.platform}
          size="sm"
        />
      </CardFooter>
    </Card>
  )
}
