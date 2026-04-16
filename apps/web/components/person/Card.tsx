'use client'

import { Image, Link } from '@heroui/react'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { roleLabel } from '~/constants/character'
import type { PatchPerson } from '~/types/api/person'

export const PersonCard = ({ person }: { person: PatchPerson }) => (
  <div key={person.id} className="flex gap-3">
    <div className="size-12 shrink-0 sm:size-16 rounded-xl bg-default-100 overflow-hidden flex items-center justify-center">
      <Image
        src={person.image || '/person.avif'}
        alt={getPreferredLanguageText(person.name)}
        className="w-full h-full object-cover"
      />
    </div>

    <div>
      <h3 className="font-semibold truncate">
        <Link color="foreground" href={`/person/${person.id}`}>
          {getPreferredLanguageText(person.name)}
        </Link>
      </h3>

      <div className="flex flex-wrap gap-2">
        {person.roles.slice(0, 3).map((r) => (
          <span className="text-sm text-default-500" key={r}>
            {roleLabel(r)}
          </span>
        ))}
      </div>
    </div>
  </div>
)
