import { CheckHashContainer } from '~/components/check-hash/Container'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  return <CheckHashContainer />
}
