import { Decoration } from '@milkdown/prose/view'
import { kunFetchFormData } from '~/utils/kunFetch'
import toast from 'react-hot-toast'
import { resizeImage } from '~/utils/resizeImage'
import type { Uploader } from '@milkdown/plugin-upload'
import type { Node } from '@milkdown/prose/model'

export const kunUploader: Uploader = async (files, schema) => {
  const images: File[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files.item(i)
    if (!file) {
      continue
    }

    if (!file.type.startsWith('image/')) {
      continue
    }

    images.push(file)
  }

  // @ts-expect-error It works fine:)
  const nodes: Node[] = await Promise.all(
    images.map(async (image) => {
      const formData = new FormData()
      const miniImage = await resizeImage(image, 1920, 1080)
      formData.append('image', miniImage)

      const res = await kunFetchFormData<
        KunResponse<{
          imageLink: string
        }>
      >('/user/image', formData)
      if (typeof res === 'string') {
        toast.error(res)
        return
      }

      const alt = image.name
      return schema.nodes.image.createAndFill({
        src: res.imageLink,
        alt
      }) as Node
    })
  )

  return nodes
}

export const kunUploadWidgetFactory = (
  pos: number,
  spec: Parameters<typeof Decoration.widget>[2]
) => {
  const widgetDOM = document.createElement('span')
  widgetDOM.textContent = '图片正在上传中'
  widgetDOM.style.color = '#006fee'
  return Decoration.widget(pos, widgetDOM, spec)
}
