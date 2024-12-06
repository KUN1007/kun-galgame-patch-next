'use client'

import { KunPostMetadata } from '~/lib/mdx/types'
import { Button } from '@nextui-org/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface NavigationProps {
  prev: KunPostMetadata | null
  next: KunPostMetadata | null
}

export const KunBottomNavigation = ({ prev, next }: NavigationProps) => {
  return (
    <div className="mt-8 flex justify-between border-t border-default-200 pt-8">
      {prev ? (
        <Link href={`/about/${prev.slug}`}>
          <Button
            variant="light"
            startContent={<ChevronLeft className="size-4" />}
          >
            {prev.title}
          </Button>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link href={`/about/${next.slug}`}>
          <Button
            variant="light"
            endContent={<ChevronRight className="size-4" />}
          >
            {next.title}
          </Button>
        </Link>
      ) : (
        <div />
      )}
    </div>
  )
}
