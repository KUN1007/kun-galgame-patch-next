import { delKv, getKv, setKv } from '~/lib/redis'
import { generateRandomCode } from '~/app/api/utils/generateRandomCode'

export const verifyCaptcha = async (
  sessionId: string,
  selectedIds: string[]
) => {
  const session = await getKv(`captcha:generate:${sessionId}`)

  await delKv(`captcha:generate:${sessionId}`)

  if (!session) {
    return '未找到您的验证请求, 请重新验证'
  }

  const correctIdsArray: string[] = JSON.parse(session)

  const isCorrect =
    selectedIds.length === correctIdsArray.length &&
    selectedIds.every((id) => correctIdsArray.includes(id))
  if (!isCorrect) {
    return '您选择的白毛女孩子不正确, 请重试'
  }

  const randomCode = generateRandomCode(10)
  await setKv(`captcha:verify:${randomCode}`, 'captcha', 60 * 60)

  return { code: randomCode }
}

export const checkCaptchaExist = async (sessionId: string) => {
  const captcha = await getKv(`captcha:verify:${sessionId}`)
  if (captcha) {
    await delKv(`captcha:verify:${sessionId}`)
    return captcha
  }
}
