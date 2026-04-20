'use client'

import { useState } from 'react'
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card'
import { Chip } from '@heroui/chip'
import { Image } from '@heroui/image'
import { KunCardStats } from '~/components/kun/CardStats'
import Link from 'next/link'
import { KunPatchAttribute } from '~/components/kun/PatchAttribute'
import { cn } from '~/utils/cn'
import { GALGAME_AGE_LIMIT_MAP } from '~/constants/galgame'
import { formatDistanceToNow } from '~/utils/formatDistanceToNow'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'

interface Props {
  patch: GalgameCard
}

export const GalgameCard = ({ patch }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const galgameName = getPreferredLanguageText(patch.name)

  return (
    <Card
      isPressable
      as={Link}
      href={`/patch/${patch.id}/introduction`}
      className="w-full border border-default-100 dark:border-default-200"
    >
      <CardHeader className="p-0">
        <div className="relative w-full mx-auto overflow-hidden text-center rounded-t-lg opacity-90">
          <div
            className={cn(
              'absolute inset-0 animate-pulse bg-default-100',
              imageLoaded ? 'opacity-0' : 'opacity-90',
              'transition-opacity duration-300'
            )}
            style={{ aspectRatio: '16/9' }}
          />
          <Image
            radius="none"
            alt={galgameName}
            className={cn(
              'size-full object-cover transition-all duration-300',
              imageLoaded ? 'scale-100 opacity-90' : 'scale-105 opacity-0'
            )}
            removeWrapper={true}
            src={
              patch.banner
                ? patch.banner.replace(/\.avif$/, '-mini.avif')
                : '/kungalgame-trans.webp'
            }
            style={{ aspectRatio: '16/9' }}
            onLoad={() => setImageLoaded(true)}
          />

          <div className="absolute z-10 rounded-full bg-background left-2 top-2">
            <Chip
              color={patch.content_limit === 'sfw' ? 'success' : 'danger'}
              variant="flat"
            >
              {GALGAME_AGE_LIMIT_MAP[patch.content_limit]}
            </Chip>
          </div>
        </div>
      </CardHeader>
      <CardBody className="justify-between space-y-2">
        <h2 className="font-semibold transition-colors space-x-2 text-medium sm:text-lg line-clamp-2 hover:text-primary-500">
          <span>{galgameName}</span>
          <span className="font-normal text-base text-xs text-default-500">
            {formatDistanceToNow(patch.created)}
          </span>
        </h2>
        <KunCardStats patch={patch} />
      </CardBody>
      <CardFooter className="pt-0">
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
