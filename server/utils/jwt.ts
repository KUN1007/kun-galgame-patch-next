import jwt from 'jsonwebtoken'
import { setKv, getKv } from '~/lib/redis'

export interface KunGalgamePayload {
  iss: string
  aud: string
  uid: number
  name: string
}

export const generateKunToken = async (
  uid: number,
  name: string,
  expire: string
) => {
  const payload: KunGalgamePayload = {
    iss: process.env.JWT_ISS!,
    aud: process.env.JWT_AUD!,
    uid,
    name
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expire
  })
  await setKv(`access:token:${payload.uid}`, token, 30 * 24 * 60 * 60)

  return token
}

export const verifyKunToken = async (refreshToken: string) => {
  try {
    const payload = jwt.verify(
      refreshToken,
      process.env.JWT_SECRET!
    ) as KunGalgamePayload
    const redisToken = await getKv(`access:token:${payload.uid}`)

    if (!redisToken) {
      return null
    }

    return payload
  } catch (error) {
    return null
  }
}
