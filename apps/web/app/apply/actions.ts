'use server'

import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'
import { getApplyStatus } from '~/app/api/apply/status/route'

export const kunGetActions = async () => {
  const payload = await verifyHeaderCookie()

  const response = await getApplyStatus(payload?.uid ?? 0)
  return response
}
