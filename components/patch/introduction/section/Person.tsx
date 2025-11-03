'use client'

import { Chip, Image } from '@heroui/react'
import type { PatchDetail } from '~/types/api/patch'

export const PersonSection = ({ detail }: { detail: PatchDetail }) => (
  <>
    {detail.person.length > 0 && (
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">制作人员</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {detail.person.map((p) => (
            <div key={p.id} className="flex gap-3">
              <div className="w-20 h-20 rounded-xl bg-default-100 overflow-hidden flex items-center justify-center">
                <Image
                  src={p.image || '/person.avif'}
                  alt={p.name_zh_cn || p.name_ja_jp}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">
                  {p.name_zh_cn || p.name_ja_jp}
                </h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {p.roles.slice(0, 3).map((role) => (
                    <Chip key={role} size="sm" variant="flat">
                      {role}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )}
  </>
)
