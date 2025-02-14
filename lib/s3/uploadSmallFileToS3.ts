import { s3 } from './client'
import { readFile } from 'fs/promises'
import { PutObjectCommand } from '@aws-sdk/client-s3'

export const uploadSmallFileToS3 = async (key: string, filePath: string) => {
  try {
    const fileBuffer = await readFile(filePath)
    const uploadCommand = new PutObjectCommand({
      Bucket: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME!,
      Key: key,
      Body: fileBuffer,
      ContentType: 'application/octet-stream'
    })
    await s3.send(uploadCommand)
  } catch (error) {
    console.log(error)
    return '上传文件错误, uploadSmallFileToS3 function ERROR'
  }
}
