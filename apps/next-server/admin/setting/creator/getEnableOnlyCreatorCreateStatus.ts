import { getKv } from '~/lib/redis'
import { KUN_PATCH_ENABLE_ONLY_CREATOR_CREATE_KEY } from '~/config/redis'

export const getEnableOnlyCreatorCreateStatus = async () => {
  const isEnableOnlyCreatorCreate = await getKv(
    KUN_PATCH_ENABLE_ONLY_CREATOR_CREATE_KEY
  )
  return {
    enableOnlyCreatorCreate: !!isEnableOnlyCreatorCreate
  }
}
