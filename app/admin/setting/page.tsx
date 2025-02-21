import { AdminSetting } from '~/components/admin/setting/Container'
import { kunMetadata } from './metadata'
import {
  kunGetDisableRegisterStatusActions,
  kunGetCommentVerifyStatusActions
} from './actions'
import type { Metadata } from 'next'

export const revalidate = 5

export const metadata: Metadata = kunMetadata

export default async function Kun() {
  const { disableRegister } = await kunGetDisableRegisterStatusActions()
  const { enableCommentVerify } = await kunGetCommentVerifyStatusActions()

  return (
    <AdminSetting
      disableRegister={disableRegister}
      enableCommentVerify={enableCommentVerify}
    />
  )
}
