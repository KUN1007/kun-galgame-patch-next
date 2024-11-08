import { getKv } from '~/lib/redis'

export const verifyVerificationCode = async (
  email: string,
  userProvidedCode: string
): Promise<boolean> => {
  const storedCode = await getKv(email)

  if (!storedCode) {
    return false
  }

  return userProvidedCode === storedCode
}
