'use client'

import { useState } from 'react'
import { useUserStore } from '~/store/userStore'
import Image from 'next/image'
import type { Patch } from '~/types/api/patch'

interface Props {
  patch: Patch
}

export const PatchBackgroundImage = ({ patch }: Props) => {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <div className="fixed inset-0 z-[-1] top-0 left-0 object-cover w-full h-full">
      <Image
        src={patch.banner}
        alt={patch.name}
        className={`object-cover w-full h-full transition-opacity duration-500 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        fill
        sizes="100vw"
        priority
        unoptimized
        onLoad={() => setImageLoaded(true)}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-background"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
    </div>
  )
}
