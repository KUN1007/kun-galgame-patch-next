import dynamic from 'next/dynamic'
import { MilkdownProvider } from '@milkdown/react'
import { useCreatePatchStore } from '~/store/editStore'
import { useRewritePatchStore } from '~/store/rewriteStore'

const KunEditor = dynamic(() => import('./Editor'), {
  ssr: false
})

interface Props {
  storeName: 'patchCreate' | 'patchRewrite'
}

export const Editor = ({ storeName }: Props) => {
  const { getData: getCreatePatchData, setData: setCreatePatchData } =
    useCreatePatchStore()
  const { getData: getRewritePatchData, setData: setRewritePatchData } =
    useRewritePatchStore()

  const saveMarkdown = (markdown: string) => {
    if (storeName === 'patchCreate') {
      setCreatePatchData({ ...getCreatePatchData(), introduction: markdown })
    } else if (storeName === 'patchRewrite') {
      setRewritePatchData({ ...getRewritePatchData(), introduction: markdown })
    }
  }

  const getMarkdown = () => {
    if (storeName === 'patchCreate') {
      return getCreatePatchData().introduction
    } else if (storeName === 'patchRewrite') {
      return getRewritePatchData().introduction
    } else {
      return ''
    }
  }

  return (
    <MilkdownProvider>
      <KunEditor valueMarkdown={getMarkdown()} saveMarkdown={saveMarkdown} />
    </MilkdownProvider>
  )
}
