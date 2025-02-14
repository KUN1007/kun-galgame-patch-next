import sharp from 'sharp'
import { uploadImageToS3 } from '~/lib/s3/uploadImageToS3'
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

  const bucketName = `user_${uid}/image`
  await uploadImageToS3(`${bucketName}/${name}.avif`, minImage)
}
