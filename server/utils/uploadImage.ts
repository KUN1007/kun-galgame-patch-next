import AWS from 'aws-sdk'
import sharp from 'sharp'
import { checkBufferSize } from './checkBufferSize'

const _upload = async (file: Buffer, fileName: string, bucket: string) => {
  const s3 = new AWS.S3({
    endpoint: process.env.KUN_VISUAL_NOVEL_IMAGE_BED_ENDPOINT,
    accessKeyId: process.env.KUN_VISUAL_NOVEL_IMAGE_BED_ACCESS_KEY,
    secretAccessKey: process.env.KUN_VISUAL_NOVEL_IMAGE_BED_SECRET_KEY,
    s3BucketEndpoint: true
  })

  const res = await s3
    .putObject({
      Body: file,
      Bucket: bucket,
      Key: fileName
    })
    .promise()

  return res.ETag
}

export const uploadImage = async (name: string, image: Buffer, pid: number) => {
  const miniImage = await sharp(image)
    .resize(1920, 1080, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: 77 })
    .toBuffer()

  if (!checkBufferSize(miniImage, 1.007)) {
    return '图片体积过大'
  }

  const bucketName = `kun-galgame-patch/patch/banner/${pid}`
  const res1 = await _upload(miniImage, `${name}.webp`, bucketName)
  return !!res1
}
