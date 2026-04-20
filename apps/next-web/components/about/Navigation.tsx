'use client'

import { KunPostMetadata } from '~/lib/mdx/types'
import { Button } from '@heroui/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface NavigationProps {
  prev: KunPostMetadata | null
  next: KunPostMetadata | null
}

export const KunBottomNavigation = ({ prev, next }: NavigationProps) => {
  return (
    <div className="flex flex-wrap justify-between gap-4 pt-8 mt-8 border-t border-default-200">
      {prev ? (
        <Button
          variant="light"
          as={Link}
          href={`/about/${prev.slug}`}
          startContent={<ChevronLeft className="size-4" />}
        >
          {prev.title}
        </Button>
      ) : (
        <div />
      )}
      {next ? (
        <Button
          as={Link}
          href={`/about/${next.slug}`}
          variant="light"
          endContent={<ChevronRight className="size-4" />}
        >
          {next.title}
        </Button>
      ) : (
        <div />
      )}
    </div>
  )
}
