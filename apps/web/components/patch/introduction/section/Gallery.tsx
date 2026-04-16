'use client'

import { Checkbox, Chip, Image } from '@heroui/react'
import { useMemo, useState } from 'react'
import type { PatchDetail } from '~/types/api/patch'

interface Props {
  detail: PatchDetail
  isNSFW: boolean
}

export const GallerySection = ({ detail, isNSFW }: Props) => {
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
        {isNSFW ? (
          <div className="flex items-center gap-4">
            <Checkbox
              isSelected={showViolence}
              onValueChange={(v) => setShowViolence(!!v)}
            >
              显示暴力
            </Checkbox>
            <Checkbox
              isSelected={showR18}
              onValueChange={(v) => setShowR18(!!v)}
            >
              显示 R18
            </Checkbox>
          </div>
        ) : (
          <span className="text-sm text-default-500">
            打开网站 NSFW 模式查看更多 CG
          </span>
        )}
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

            <div className="absolute space-x-2 bottom-2 right-2 z-10">
              {s.sexual > 0 && (
                <Chip size="sm" variant="solid" color="warning">
                  色情
                </Chip>
              )}

              {s.violence > 0 && (
                <Chip size="sm" variant="solid" color="danger">
                  暴力
                </Chip>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
