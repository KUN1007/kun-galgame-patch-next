import { s3 } from './client'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'

export const deleteFileFromS3 = async (key: string) => {
  const deleteCommand = new DeleteObjectCommand({
    Bucket: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME!,
    Key: key
  })
  await s3.send(deleteCommand)
}
