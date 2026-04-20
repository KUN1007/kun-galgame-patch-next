import { KunFriendLink } from '~/components/friend-link/KunFriendLink'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return <KunFriendLink />
}
