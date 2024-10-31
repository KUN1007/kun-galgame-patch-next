import AWS from 'aws-sdk'

export const uploadObject = async (
  file: Buffer,
  fileName: string,
  bucket: string
) => {
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
