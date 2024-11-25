import { argon2id } from '@noble/hashes/argon2'
import crypto from 'crypto'

const options = {
  t: 2, // Number of iterations (time cost)
  m: 8192, // Memory cost in kibibytes (64 MB)
  p: 3 // Parallelism (threads)
}

export const hashPassword = async (password: string) => {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = argon2id(password, salt, options)
  return `${salt}:${Buffer.from(derivedKey).toString('hex')}`
}

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  const [salt, hash] = hashedPassword.split(':')
  const derivedKey = argon2id(password, salt, options)
  return Buffer.from(derivedKey).toString('hex') === hash
}

// import { hash, compare } from 'bcrypt'

// export const hashPassword = async (password: string) => {
//   const hashedPassword = await hash(password, 7)
//   return hashedPassword
// }

// export const verifyPassword = async (
//   password: string,
//   hashedPassword: string
// ) => {
//   const res = await compare(password, hashedPassword)
//   return res
// }
