'use server'

import { kunServerGet } from '~/utils/actions/kunServerFetch'
import { verifyHeaderCookie } from '~/utils/actions/verifyHeaderCookie'

export const kunGetActions = async () => {
  const payload = await verifyHeaderCookie()

  try {
    const response = await kunServerGet<any>('/home')
    return { response, payload }
  } catch (err) {
    return { response: `${err instanceof Error ? err.message : err}`, payload }
  }
}
