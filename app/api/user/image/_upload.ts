import sharp from 'sharp'

import { uploadObject } from '~/app/api/utils/uploadImage'
import { checkBufferSize } from '~/app/api/utils/checkBufferSize'

export const uploadIntroductionImage = async (
  name: string,
  image: ArrayBuffer,
  uid: number
) => {
  const minImage = await sharp(image)
    .resize(1920, 1080, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .avif({ quality: 30 })
    .toBuffer()

  if (!checkBufferSize(minImage, 1.007)) {
    return '图片体积过大'
  }

  const bucketName = `kun-galgame-patch/user_${uid}/image`
  const res1 = await uploadObject(minImage, `${name}.avif`, bucketName)
  return !!res1
}
