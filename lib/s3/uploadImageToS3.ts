import { S3Client } from '@aws-sdk/client-s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

// Image will put to a different storage provider
export const s3 = new S3Client({
  endpoint: process.env.KUN_VISUAL_NOVEL_IMAGE_BED_ENDPOINT!,
  region: 'auto',
  credentials: {
    accessKeyId: process.env.KUN_VISUAL_NOVEL_IMAGE_BED_ACCESS_KEY!,
    secretAccessKey: process.env.KUN_VISUAL_NOVEL_IMAGE_BED_SECRET_KEY!
  }
})

export const uploadImageToS3 = async (key: string, fileBuffer: Buffer) => {
  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.KUN_VISUAL_NOVEL_S3_STORAGE_BUCKET_NAME!,
    Key: key,
    Body: fileBuffer,
    ContentType: 'application/octet-stream'
  })
  await s3.send(uploadCommand)
}
