import { SearchPage } from '~/components/search/Container'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Search() {
  return <SearchPage />
}
