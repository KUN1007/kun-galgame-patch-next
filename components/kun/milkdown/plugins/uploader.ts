import { Decoration } from '@milkdown/prose/view'
import { api } from '~/lib/trpc-client'
import toast from 'react-hot-toast'
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

  // @ts-ignore-next-line
  const nodes: Node[] = await Promise.all(
    images.map(async (image) => {
      const formData = new FormData()
      formData.append('image', image)

      const res = await api.edit.image.mutate(formData)
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
