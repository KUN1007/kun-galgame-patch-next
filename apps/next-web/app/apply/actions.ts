'use server'

import { kunServerGet } from '~/utils/actions/kunServerFetch'

export const kunGetActions = async () => {
  try {
    const response = await kunServerGet<any>('/apply/status')
    return response
  } catch (error) {
    return (error as Error).message
  }
}
