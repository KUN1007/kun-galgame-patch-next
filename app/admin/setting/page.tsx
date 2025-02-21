import { AdminSetting } from '~/components/admin/setting/Container'
import { kunMetadata } from './metadata'
import { kunGetDisableRegisterStatusActions } from './actions'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { disableRegister } = await kunGetDisableRegisterStatusActions()

  return <AdminSetting disableRegister={disableRegister} />
}
