'use server'

import { getDisableRegisterStatus } from '~/app/api/admin/setting/register/route'
import { getCommentVerifyStatus } from '~/app/api/admin/setting/comment/getCommentVerifyStatus'
import { getEnableOnlyCreatorCreateStatus } from '~/app/api/admin/setting/creator/getEnableOnlyCreatorCreateStatus'

export const kunGetDisableRegisterStatusActions = async () => {
  const response = await getDisableRegisterStatus()
  return response
}

export const kunGetCommentVerifyStatusActions = async () => {
  const response = await getCommentVerifyStatus()
  return response
}

export const kunGetEnableOnlyCreatorCreateStatus = async () => {
  const response = await getEnableOnlyCreatorCreateStatus()
  return response
}
