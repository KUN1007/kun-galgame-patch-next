'use server'

import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetDisableRegisterStatusActions = async () => {
  try {
    const response = await kunServerGet<any>('/admin/setting/register')
    return response
  } catch (error) {
    return (error as Error).message
  }
}

export const kunGetCommentVerifyStatusActions = async () => {
  try {
    const response = await kunServerGet<any>('/admin/setting/comment-verify')
    return response
  } catch (error) {
    return (error as Error).message
  }
}

export const kunGetEnableOnlyCreatorCreateStatus = async () => {
  try {
    const response = await kunServerGet<any>('/admin/setting/creator-only')
    return response
  } catch (error) {
    return (error as Error).message
  }
}
