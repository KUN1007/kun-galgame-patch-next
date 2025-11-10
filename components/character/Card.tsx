'use client'

import { Card, CardFooter } from '@heroui/card'
import { Chip, Image } from '@heroui/react'
import Link from 'next/link'
import { ROLE_LABELS } from '~/constants/character'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import { cn } from '~/utils/cn'
import type { PatchCharacter } from '~/types/api/character'

export const CharacterCard = ({
  characters
}: {
  characters: PatchCharacter
}) => (
  <Card
    isFooterBlurred
    isPressable
    as={Link}
    href={`/character/${characters.id}`}
    key={characters.id}
    className="shadow-sm overflow-hidden"
  >
    <div className="aspect-[3/4] overflow-hidden bg-default-100">
      <Image
        removeWrapper
        src={characters.image || '/char.avif'}
        alt={getPreferredLanguageText(characters.name)}
        className={cn(
          'w-full dark:opacity-50 h-full object-cover object-[50%_top]',
          characters.image ? '' : 'opacity-30!'
        )}
      />
    </div>
    <CardFooter className="justify-between pr-1 bg-background/60 border-white/20 border-1 overflow-hidden py-1 absolute w-[calc(100%_-_8px)] rounded-large bottom-1 shadow-small ml-1 z-10">
      <h3 className="font-bold text-sm truncate">
        {getPreferredLanguageText(characters.name)}
      </h3>
      {characters.role && (
        <Chip size="sm" color="secondary" variant="flat">
          {ROLE_LABELS[characters.role]}
        </Chip>
      )}
    </CardFooter>
  </Card>
)
