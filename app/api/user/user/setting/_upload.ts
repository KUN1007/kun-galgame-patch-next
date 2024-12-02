import sharp from 'sharp'

import { uploadObject } from '~/app/api/utils/uploadImage'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'

export const uploadUserAvatar = async (image: ArrayBuffer, uid: number) => {
  const avatar = await sharp(image)
    .resize(256, 256, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: 60 })
    .toBuffer()
  const miniAvatar = await sharp(image)
    .resize(100, 100, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: 50 })
    .toBuffer()

  if (!checkBufferSize(avatar, 1.007)) {
    return '图片体积过大'
  }

  const bucketName = `kun-galgame-patch/user/avatar/user_${uid}`

  const res1 = await uploadObject(avatar, 'avatar.avif', bucketName)
  const res2 = await uploadObject(miniAvatar, 'avatar-mini.avif', bucketName)

  return !!(res1 && res2)
}
