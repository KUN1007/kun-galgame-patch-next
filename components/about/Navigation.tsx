'use client'

import { PostMetadata } from '~/lib/mdx/types'
import { Button } from '@nextui-org/react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface NavigationProps {
  prev: PostMetadata | null
  next: PostMetadata | null
}

export const KunBottomNavigation = ({ prev, next }: NavigationProps) => {
  return (
    <div className="flex justify-between pt-8 mt-8 border-t border-default-200 dark:border-default-800">
      {prev ? (
        <Link href={`/about/${prev.slug}`}>
          <Button
            variant="light"
            startContent={<ChevronLeft className="w-4 h-4" />}
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
            endContent={<ChevronRight className="w-4 h-4" />}
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
