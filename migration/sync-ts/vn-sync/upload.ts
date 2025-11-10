import { stat } from 'fs/promises'
import { uploadSmallFileToS3 } from '../../../lib/s3/uploadSmallFileToS3'
import { uploadLargeFileToS3 } from '../../../lib/s3/uploadLargeFileToS3'
import { MAX_SMALL_FILE_SIZE } from '../../../config/upload'
import sharp from 'sharp'
import { uploadImageToS3 } from '../../../lib/s3/uploadImageToS3'
import { checkBufferSize } from '../../../app/api/utils/checkBufferSize'
import { MAX_SIZE, COMPRESS_QUALITY } from '../../../app/api/utils/constants'

export async function uploadBannerForPatchWebp(
  patchId: number,
  image: ArrayBuffer
) {
  const banner = await sharp(image)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: COMPRESS_QUALITY })
    .toBuffer()
  const miniBanner = await sharp(image)
    .resize(460, 259, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: COMPRESS_QUALITY })
    .toBuffer()

  if (!checkBufferSize(miniBanner, MAX_SIZE)) {
    return '图片太大'
  }

  const bucketKey = `patch/${patchId}/banner`
  await uploadImageToS3(`${bucketKey}/banner.webp`, banner)
  await uploadImageToS3(`${bucketKey}/banner-mini.webp`, miniBanner)
  const link = `${process.env.KUN_VISUAL_NOVEL_IMAGE_BED_URL}/patch/${patchId}/banner/banner.webp`
  return { link }
}

export async function uploadPatchFileToS3(
  patchId: number,
  hash: string,
  filePath: string
) {
  const fileName = filePath.split(/[\\/]/).pop()!
  const s3Key = `patch/${patchId}/${hash}/${fileName}`
  const st = await stat(filePath)
  if (st.size < MAX_SMALL_FILE_SIZE) {
    const r = await uploadSmallFileToS3(s3Key, filePath)
    if (typeof r === 'string') return r
  } else {
    const r = await uploadLargeFileToS3(s3Key, filePath)
    if (typeof r === 'string') return r
  }
  const url = `${process.env.KUN_VISUAL_NOVEL_S3_STORAGE_URL}/${s3Key}`
  return { url }
}
