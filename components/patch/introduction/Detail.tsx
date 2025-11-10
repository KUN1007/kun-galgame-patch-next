'use client'

import type { PatchDetail } from '~/types/api/patch'
import { OverviewSection } from './section/Overview'
import { TagSection } from './section/Tag'
import { ReleaseSection } from './section/Release'
import { CharacterSection } from './section/Character'
import { PersonSection } from './section/Person'
import { GallerySection } from './section/Gallery'

interface Props {
  detail: PatchDetail
  isNSFW: boolean
}

export const PatchDetailIntro = ({ detail, isNSFW }: Props) => {
  return (
    <div className="space-y-8">
      <OverviewSection detail={detail} />
      <TagSection detail={detail} />
      <GallerySection isNSFW={isNSFW} detail={detail} />
      <CharacterSection isNSFW={isNSFW} detail={detail} />
      <PersonSection detail={detail} />
      <ReleaseSection detail={detail} />
    </div>
  )
}
