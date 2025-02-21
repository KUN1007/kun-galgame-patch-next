import { getKv } from '~/lib/redis'
import { KUN_PATCH_ENABLE_COMMENT_VERIFY_KEY } from '~/config/redis'

export const getCommentVerifyStatus = async () => {
  const isEnableCommentVerify = await getKv(KUN_PATCH_ENABLE_COMMENT_VERIFY_KEY)
  return {
    enableCommentVerify: !!isEnableCommentVerify
  }
}
