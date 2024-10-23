import jwt from 'jsonwebtoken'

export interface KunGalgamePayload {
  iss: string
  aud: string
  uid: number
  name: string
}

export const generateToken = (uid: number, name: string, expire: string) => {
  console.log(process.env.JWT_ISS)

  const payload: KunGalgamePayload = {
    iss: process.env.JWT_ISS!,
    aud: process.env.JWT_AUD!,
    uid,
    name
  }

  const token = jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: expire
  })

  return token
}
