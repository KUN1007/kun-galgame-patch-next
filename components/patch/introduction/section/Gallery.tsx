'use client'

import { Image } from '@heroui/react'
import type { PatchDetail } from '~/types/api/patch'

export const GallerySection = ({ detail }: { detail: PatchDetail }) => (
  <>
    {detail.screenshot.length > 0 && (
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">画廊</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {detail.screenshot.map((s) => (
            <div
              key={s.id}
              className="relative aspect-video bg-default-100 overflow-hidden rounded-lg"
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
    )}
  </>
)
