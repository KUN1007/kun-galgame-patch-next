'use client'

import { Card, CardFooter } from '@heroui/card'
import { Chip, Image } from '@heroui/react'
import Link from 'next/link'
import { ROLE_LABELS } from '~/constants/character'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { cn } from '~/utils/cn'
import type { PatchDetail } from '~/types/api/patch'

const ORDER = ['protagonist', 'main', 'side']

const sortCharacters = (chars: PatchDetail['char']) => {
  const weight = (role?: string | null) => {
    const key = String(role || '').trim()
    const i = ORDER.indexOf(key)
    return i === -1 ? 999 : i
  }

  return [...chars].sort((a, b) => {
    const wa = weight(a.role)
    const wb = weight(b.role)
    if (wa !== wb) return wa - wb
    const na = getPreferredLanguageText(a.name)
    const nb = getPreferredLanguageText(b.name)
    return na.localeCompare(nb)
  })
}

export const CharacterSection = ({ detail }: { detail: PatchDetail }) => {
  if (!detail.char.length) {
    return null
  }

  const sortedChars = sortCharacters(detail.char)

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-1 h-6 bg-primary rounded" />
        <h2 className="text-2xl font-bold">角色</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {sortedChars.map((c) => (
          <Card
            isFooterBlurred
            isPressable
            as={Link}
            href={`/character/${c.id}`}
            key={c.id}
            className="shadow-sm overflow-hidden"
          >
            <div className="aspect-[3/4] overflow-hidden bg-default-100">
              <Image
                removeWrapper
                src={c.image || '/char.avif'}
                alt={getPreferredLanguageText(c.name)}
                className={cn(
                  'w-full dark:opacity-50 h-full object-cover object-[50%_top]',
                  c.image ? '' : 'opacity-30!'
                )}
              />
            </div>
            <CardFooter className="justify-between pr-1 bg-background/60 border-white/20 border-1 overflow-hidden py-1 absolute w-[calc(100%_-_8px)] rounded-large bottom-1 shadow-small ml-1 z-10">
              <h3 className="font-bold text-sm truncate">
                {getPreferredLanguageText(c.name)}
              </h3>
              {c.role && (
                <Chip size="sm" color="secondary" variant="flat">
                  {ROLE_LABELS[c.role]}
                </Chip>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  )
}
