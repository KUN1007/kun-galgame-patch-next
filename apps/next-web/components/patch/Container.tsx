'use client'

import { useEffect } from 'react'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { PatchHeaderInfo } from './header/Info'
import { PatchHeaderTabs } from './header/Tabs'
import { PatchBackgroundImage } from './header/BackgroundImage'
import { KunAutoImageViewer } from '~/components/kun/image-viewer/AutoImageViewer'
import type { PatchHeader } from '~/types/api/patch'

interface Props {
  children: React.ReactNode
  patch: PatchHeader
  uid?: number
}

export const PatchContainer = ({ children, patch }: Props) => {
  const { setData } = useRewritePatchStore()

  useEffect(() => {
    setData({
      id: patch.id,
      vndbId: patch.vndbId ?? '',
      name: patch.name,
      introduction: patch.introductionMarkdown,
      alias: patch.alias,
      released: patch.released,
      contentLimit: patch.content_limit
    })

    window.scroll(0, 0)
  }, [patch, setData])

  return (
    <div className="w-full space-y-6">
      <div className="relative w-full mx-auto max-w-7xl">
        <PatchBackgroundImage patch={patch} />

        <KunAutoImageViewer />

        <PatchHeaderInfo patch={patch} />

        <div className="mt-6">
          <PatchHeaderTabs id={patch.id} />
        </div>
      </div>

      {children}
    </div>
  )
}
