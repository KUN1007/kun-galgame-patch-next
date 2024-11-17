'use client'

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Image } from '@nextui-org/image'
import { Chip } from '@nextui-org/chip'
import Link from 'next/link'
import { KunCardStats } from '~/components/kun/CardStats'
import { useState } from 'react'

interface Props {
  patch: GalgameCard
}

export const GalgameCard = ({ patch }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <Card className="w-full">
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
        <Link href={`/patch/${patch.id}/introduction`} className="group">
          <h3 className="text-lg font-semibold transition-colors group-hover:text-primary-500 line-clamp-2">
            {patch.name}
          </h3>
        </Link>
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
              {type}
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
              {platform}
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
              {lang}
            </Chip>
          ))}
        </div>
      </CardFooter>
    </Card>
  )
}
