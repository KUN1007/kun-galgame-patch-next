import sharp from 'sharp'

import { checkBufferSize } from '~/app/api/utils/checkBufferSize'
import { MAX_SIZE, COMPRESS_QUALITY } from '~/app/api/utils/constants'
import { uploadImageToS3 } from '~/lib/s3/uploadImageToS3'

export const uploadPatchBanner = async (image: ArrayBuffer, id: number) => {
  const banner = await sharp(image)
    .resize(1920, 1080, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: COMPRESS_QUALITY })
    .toBuffer()
  const miniBanner = await sharp(image)
    .resize(460, 259, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: COMPRESS_QUALITY })
    .toBuffer()

  if (!checkBufferSize(miniBanner, MAX_SIZE)) {
    return '图片体积过大'
  }

  const bucketName = `patch/${id}/banner`

  await uploadImageToS3(`${bucketName}/banner.avif`, banner)
  await uploadImageToS3(`${bucketName}/banner-mini.avif`, miniBanner)
}
