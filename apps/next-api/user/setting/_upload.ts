import sharp from 'sharp'

import { MAX_SIZE, COMPRESS_QUALITY } from '~/app/api/utils/constants'
import { uploadImageToS3 } from '~/lib/s3/uploadImageToS3'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'

export const uploadUserAvatar = async (image: ArrayBuffer, uid: number) => {
  const avatar = await sharp(image)
    .resize(256, 256, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: COMPRESS_QUALITY })
    .toBuffer()
  const miniAvatar = await sharp(image)
    .resize(100, 100, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: COMPRESS_QUALITY })
    .toBuffer()

  if (!checkBufferSize(avatar, MAX_SIZE)) {
    return '图片体积过大'
  }

  const bucketName = `user/avatar/user_${uid}`

  await uploadImageToS3(`${bucketName}/avatar.avif`, avatar)
  await uploadImageToS3(`${bucketName}/avatar-mini.avif`, miniAvatar)
}
