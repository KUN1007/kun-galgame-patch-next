import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { setKv } from '~/lib/redis'
import { readImageBase64, shuffleKunArray } from './_utils'

const IMAGES_PER_CAPTCHA = 4
const MIN_WHITE_HAIR_IMAGES = 1
const MAX_WHITE_HAIR_IMAGES = 3

export const generateCaptcha = async () => {
  const whiteHairPath = path.join(process.cwd(), 'server/image/auth/white')
  const otherHairPath = path.join(process.cwd(), 'server/image/auth/other')

  const whiteHairFiles = await fs.readdir(whiteHairPath)
  const otherHairFiles = await fs.readdir(otherHairPath)

  const numWhiteHair = Math.floor(
    Math.random() * (MAX_WHITE_HAIR_IMAGES - MIN_WHITE_HAIR_IMAGES + 1) +
      MIN_WHITE_HAIR_IMAGES
  )
  const numOtherHair = IMAGES_PER_CAPTCHA - numWhiteHair

  const selectedWhite = shuffleKunArray(whiteHairFiles).slice(0, numWhiteHair)
  const selectedOther = shuffleKunArray(otherHairFiles).slice(0, numOtherHair)

  const images = [
    ...(await Promise.all(
      selectedWhite.map(async (file) => ({
        id: crypto.randomUUID(),
        data: await readImageBase64(path.join(whiteHairPath, file)),
        isWhiteHair: true
      }))
    )),
    ...(await Promise.all(
      selectedOther.map(async (file) => ({
        id: crypto.randomUUID(),
        data: await readImageBase64(path.join(otherHairPath, file)),
        isWhiteHair: false
      }))
    ))
  ]

  const shuffledImages = shuffleKunArray(images)
  const sessionId = crypto.randomUUID()

  const correctIds = images
    .filter((img) => img.isWhiteHair)
    .map((img) => img.id)

  await setKv(
    `captcha:generate:${sessionId}`,
    JSON.stringify(correctIds),
    5 * 60
  )

  return {
    images: shuffledImages.map((img) => ({
      id: img.id,
      data: img.data
    })),
    sessionId
  }
}
