'use client'

import { Card, CardBody } from '@heroui/card'
import { Chip, Image } from '@heroui/react'
import type { PatchDetail } from '~/types/api/patch'

export const CharacterSection = ({ detail }: { detail: PatchDetail }) => (
  <>
    {detail.char.length > 0 && (
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-1 h-6 bg-primary rounded" />
          <h2 className="text-2xl font-bold">角色</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {detail.char.map((c) => (
            <Card key={c.id} className="shadow-sm overflow-hidden">
              <div className="aspect-[3/4] overflow-hidden bg-default-100">
                <Image
                  src={c.image || '/char.avif'}
                  alt={c.name_zh_cn || c.name_ja_jp}
                  className="w-full h-full object-cover object-[50%_top]"
                />
              </div>
              <CardBody className="p-3">
                <h3 className="font-bold text-sm truncate">
                  {c.name_zh_cn || c.name_ja_jp}
                </h3>
                <div className="flex gap-2 mt-2">
                  <Chip
                    size="sm"
                    color={c.gender === 'female' ? 'danger' : 'primary'}
                  >
                    {c.gender}
                  </Chip>
                  {c.roles.slice(0, 2).map((role) => (
                    <Chip key={role} size="sm" variant="flat">
                      {role}
                    </Chip>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    )}
  </>
)
