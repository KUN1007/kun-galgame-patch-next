'use client'

import { useState } from 'react'
import Image from 'next/image'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { PatchHeader } from '~/types/api/patch'

interface Props {
  patch: PatchHeader
}

export const PatchBackgroundImage = ({ patch }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="fixed inset-0 z-[-1] top-0 left-0 object-cover w-full h-full">
      {patch.banner && (
        <Image
          src={patch.banner}
          alt={getPreferredLanguageText(patch.name)}
          className={`object-cover w-full h-full transition-opacity duration-500 ${
            imageLoaded ? 'opacity-20' : 'opacity-0'
          }`}
          fill
          sizes="100vw"
          priority
          unoptimized
          onLoad={() => setImageLoaded(true)}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent"></div>
    </div>
  )
}
