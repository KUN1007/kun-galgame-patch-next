'use client'

import { useEffect } from 'react'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { PatchHeaderInfo } from './Info'
import { PatchHeaderTabs } from './Tabs'
// TODO:
import { PatchBackgroundImage } from './BackgroundImage'
import { KunAutoImageViewer } from '~/components/kun/image-viewer/AutoImageViewer'
import type { Patch, PatchIntroduction } from '~/types/api/patch'

interface PatchHeaderProps {
  patch: Patch
  intro: PatchIntroduction
}

export const PatchHeaderContainer = ({ patch, intro }: PatchHeaderProps) => {
  const { setData } = useRewritePatchStore()

  useEffect(() => {
    setData({
      id: patch.id,
      vndbId: patch.vndbId ?? '',
      name: patch.name,
      introduction: patch.introduction,
      alias: patch.alias,
      released: intro.released,
      contentLimit: patch.content_limit
    })

    window.scroll(0, 0)
  }, [patch, intro, setData])

  return (
    <div className="relative w-full mx-auto max-w-7xl">
      {/* <PatchBackgroundImage patch={patch} /> */}

      <KunAutoImageViewer />

      <PatchHeaderInfo patch={patch} />

      <div className="mt-6">
        <PatchHeaderTabs id={patch.id} />
      </div>
    </div>
  )
}
