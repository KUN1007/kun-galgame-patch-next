import toast from 'react-hot-toast'
import { dataURItoBlob } from '~/utils/dataURItoBlob'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']

export const checkImageValid = (file: File) => {
  if (allowedTypes.includes(file.type)) {
    return true
  } else {
    toast.error('我们仅支持 jpg, png, webp, avif 图片')
    return false
  }
}

export const resizeImage = (
  file: File,
  width: number,
  height: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.src = URL.createObjectURL(file)
    image.onload = () => {
      let newWidth = image.width
      let newHeight = image.height

      if (image.width > width || image.height > height) {
        const aspectRatio = image.width / image.height
        if (aspectRatio > 1) {
          newWidth = width
          newHeight = newWidth / aspectRatio
        } else {
          newHeight = height
          newWidth = newHeight * aspectRatio
        }
      }

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = newWidth
      canvas.height = newHeight

      ctx?.drawImage(image, 0, 0, newWidth, newHeight)
      const resizedBlob = dataURItoBlob(canvas.toDataURL('image/webp', 0.77))
      const file = new File([resizedBlob], 'image.webp', { type: 'image/webp' })

      if (file.size > 1.007 * 1024 * 1024) {
        toast.error('压缩后图片体积过大, 超过 1007kb')
        reject(new Error('Image is too large.'))
      } else {
        resolve(file)
      }
    }
  })
}
