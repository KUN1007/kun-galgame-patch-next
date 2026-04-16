import { UserSettings } from '~/components/settings/user/Container'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function User() {
  return <UserSettings />
}
