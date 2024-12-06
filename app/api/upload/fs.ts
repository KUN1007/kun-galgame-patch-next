import path from 'path'
import { createReadStream, createWriteStream } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { blake3 } from '@noble/hashes/blake3'
import { bytesToHex } from '@noble/hashes/utils'

export const generateFileHash = async (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hashInstance = blake3.create({})
    const fileStream = createReadStream(filePath)
    fileStream.on('data', (chunk) => {
      hashInstance.update(chunk)
    })
    fileStream.on('end', () => {
      const hashString = bytesToHex(hashInstance.digest())
      resolve(hashString)
    })
    fileStream.on('error', (err) => {
      reject(err)
    })
  })
}

export const calculateFileStreamHash = async (
  fileBuffer: Buffer,
  fileDir: string,
  filename: string
) => {
  await mkdir(fileDir, { recursive: true })

  const tempFilePath = path.posix.join(fileDir, 'temp')
  const hashInstance = blake3.create({})

  const writeStream = createWriteStream(tempFilePath)

  try {
    await new Promise<void>((resolve, reject) => {
      writeStream.on('error', reject)
      writeStream.on('finish', resolve)

      writeStream.write(fileBuffer, (error) => {
        if (error) {
          reject(error)
        } else {
          hashInstance.update(fileBuffer)
          writeStream.end()
        }
      })
    })

    const fileHash = bytesToHex(hashInstance.digest())
    await mkdir(`${fileDir}/${fileHash}`, { recursive: true })
    const finalFilePath = path.posix.join(fileDir, `${fileHash}/${filename}`)

    await writeFile(finalFilePath, fileBuffer)

    return { fileHash, finalFilePath }
  } finally {
    writeStream.destroy()
  }
}
