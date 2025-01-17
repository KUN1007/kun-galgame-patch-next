import sharp from 'sharp'

import { uploadObject } from '~/app/api/utils/uploadImage'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'
import { MAX_SIZE, COMPRESS_QUALITY } from '~/app/api/utils/constants'

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

  const bucketName = `kun-galgame-patch/patch/${id}/banner`
  const res1 = await uploadObject(banner, 'banner.avif', bucketName)
  const res2 = await uploadObject(miniBanner, 'banner-mini.avif', bucketName)

  return !!(res1 && res2)
}
