import { SearchPage } from '~/components/search/Container'
import { kunMetadata } from './metadata'
import { Suspense } from 'react'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Search() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  )
}
