'use client'

import { Checkbox, Image } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { PatchDetail } from '~/types/api/patch'

export const GallerySection = ({ detail }: { detail: PatchDetail }) => {
  const [showViolence, setShowViolence] = useState(false)
  const [showR18, setShowR18] = useState(false)

  const list = useMemo(() => {
    return detail.screenshot.filter((s) => {
      const okViolence = showViolence || Number(s.violence || 0) === 0
      const okSexual = showR18 || Number(s.sexual || 0) === 0
      return okViolence && okSexual
    })
  }, [detail.screenshot, showViolence, showR18])

  if (!detail.screenshot.length) {
    return null
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">画廊</h2>
        </div>
        <div className="flex items-center gap-4">
          <Checkbox
            isSelected={showViolence}
            onValueChange={(v) => setShowViolence(!!v)}
          >
            显示暴力
          </Checkbox>
          <Checkbox isSelected={showR18} onValueChange={(v) => setShowR18(!!v)}>
            显示 R18
          </Checkbox>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map((s) => (
          <div
            key={s.id}
            className="relative aspect-video bg-default-100 overflow-hidden rounded-2xl"
          >
            <Image
              src={s.url}
              alt={s.image_id}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
