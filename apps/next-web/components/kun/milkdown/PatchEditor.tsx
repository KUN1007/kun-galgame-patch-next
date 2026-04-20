import { useCreatePatchStore } from '~/store/editStore'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { useMounted } from '~/hooks/useMounted'
import { KunLoading } from '../Loading'
import { KunEditor } from './Editor'

interface Props {
  storeName: 'patchCreate' | 'patchRewrite'
  lang: Language
}

export const Editor = ({ storeName, lang }: Props) => {
  const getCreatePatchData = useCreatePatchStore((state) => state.getData)
  const setCreatePatchData = useCreatePatchStore((state) => state.setData)
  const getRewritePatchData = useRewritePatchStore((state) => state.getData)
  const setRewritePatchData = useRewritePatchStore((state) => state.setData)

  const isMounted = useMounted()

  const saveMarkdown = (markdown: string) => {
    if (storeName === 'patchCreate') {
      const prev = getCreatePatchData()
      setCreatePatchData({
        ...prev,
        introduction: { ...prev.introduction, [lang]: markdown }
      })
    } else if (storeName === 'patchRewrite') {
      const prev = getRewritePatchData()
      setRewritePatchData({
        ...prev,
        introduction: { ...prev.introduction, [lang]: markdown }
      })
    }
  }

  const getMarkdown = () => {
    if (storeName === 'patchCreate') {
      return getCreatePatchData().introduction[lang]
    } else if (storeName === 'patchRewrite') {
      return getRewritePatchData().introduction[lang]
    } else {
      return ''
    }
  }

  if (!isMounted) {
    return <KunLoading className="min-h-64" hint="正在加载编辑器" />
  }

  return (
    <KunEditor
      valueMarkdown={getMarkdown()}
      saveMarkdown={saveMarkdown}
      language={lang}
    />
  )
}
