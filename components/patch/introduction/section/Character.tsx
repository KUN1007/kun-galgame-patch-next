'use client'

import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { CharacterCard } from '~/components/character/Card'
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
          <CharacterCard key={c.id} characters={c} />
        ))}
      </div>
    </section>
  )
}
