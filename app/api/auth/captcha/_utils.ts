import fs from 'fs/promises'
import path from 'path'

export const shuffleKunArray = <T>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const readImageBase64 = async (filePath: string) => {
  const fileBuffer = await fs.readFile(filePath)
  return `data:image/${path.extname(filePath).substring(1)};base64,${fileBuffer.toString('base64')}`
}
