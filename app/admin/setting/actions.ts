'use server'

import { getDisableRegisterStatus } from '~/app/api/admin/setting/register/route'

export const kunGetDisableRegisterStatusActions = async () => {
  const response = await getDisableRegisterStatus()
  return response
}
