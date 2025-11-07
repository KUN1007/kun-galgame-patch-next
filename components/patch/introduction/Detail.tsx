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
}

export const PatchDetailIntro = ({ detail }: Props) => {
  return (
    <div className="space-y-8">
      <OverviewSection detail={detail} />
      <TagSection detail={detail} />
      <GallerySection detail={detail} />
      <CharacterSection detail={detail} />
      <PersonSection detail={detail} />
      <ReleaseSection detail={detail} />
    </div>
  )
}
