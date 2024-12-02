'use client'

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { Chip } from '@nextui-org/chip'
import { KunCardStats } from '~/components/kun/CardStats'
import { useRouter } from 'next-nprogress-bar'
import { useState } from 'react'
import {
  SUPPORTED_TYPE_MAP,
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP
} from '~/constants/resource'

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
        <div className="relative w-full mx-auto overflow-hidden text-center rounded-t-lg">
          <div
            className={`absolute inset-0 bg-default-100 animate-pulse ${
              imageLoaded ? 'opacity-0' : 'opacity-100'
            } transition-opacity duration-300`}
            style={{ aspectRatio: '16/9' }}
          />
          <Image
            alt={patch.name}
            className={`object-cover w-full h-full transition-all duration-300 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            src={patch.banner.replace(/\.avif$/, '-mini.avif')}
            style={{ aspectRatio: '16/9' }}
            onLoad={() => setImageLoaded(true)}
          />
        </div>
      </CardHeader>
      <CardBody className="px-4 py-2 space-y-3">
        <h3 className="text-lg font-semibold transition-colors hover:text-primary-500 line-clamp-2">
          {patch.name}
        </h3>
        <KunCardStats patch={patch} />
      </CardBody>
      <CardFooter className="flex-col items-start gap-2 px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {patch.type.map((type) => (
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
        <div className="flex flex-wrap gap-1.5">
          {patch.language.map((lang) => (
            <Chip
              key={lang}
              size="sm"
              color="success"
              variant="flat"
              className="text-xs"
            >
              {SUPPORTED_LANGUAGE_MAP[lang]}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {patch.platform.map((platform) => (
            <Chip
              key={platform}
              size="sm"
              color="secondary"
              variant="flat"
              className="text-xs"
            >
              {SUPPORTED_PLATFORM_MAP[platform]}
            </Chip>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
