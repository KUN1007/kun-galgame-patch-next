import { MilkdownProvider } from '@milkdown/react'
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react'
import { useCreatePatchStore } from '~/store/editStore'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '../Loading'
import { KunEditor } from './Editor'

interface Props {
  storeName: 'patchCreate' | 'patchRewrite'
}

export const Editor = ({ storeName }: Props) => {
  const getCreatePatchData = useCreatePatchStore((state) => state.getData)
  const setCreatePatchData = useCreatePatchStore((state) => state.setData)
  const getRewritePatchData = useRewritePatchStore((state) => state.getData)
  const setRewritePatchData = useRewritePatchStore((state) => state.setData)

  const isMounted = useMounted()

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

  if (!isMounted) {
    return <KunLoading className="min-h-64" hint="正在加载编辑器" />
  }

  return (
    <MilkdownProvider>
      <ProsemirrorAdapterProvider>
        <KunEditor valueMarkdown={getMarkdown()} saveMarkdown={saveMarkdown} />
      </ProsemirrorAdapterProvider>
    </MilkdownProvider>
  )
}
