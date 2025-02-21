'use server'

import { getDisableRegisterStatus } from '~/app/api/admin/setting/register/route'
import { getCommentVerifyStatus } from '~/app/api/admin/setting/comment/route'

export const kunGetDisableRegisterStatusActions = async () => {
  const response = await getDisableRegisterStatus()
  return response
}

export const kunGetCommentVerifyStatusActions = async () => {
  const response = await getCommentVerifyStatus()
  return response
}
