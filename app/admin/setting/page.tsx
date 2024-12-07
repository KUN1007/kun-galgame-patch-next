import { AdminSetting } from '~/components/admin/setting/Container'
import { kunMetadata } from './metadata'
import type { Metadata } from 'next'

export const metadata: Metadata = kunMetadata

export default function Kun() {
  return <AdminSetting />
}
