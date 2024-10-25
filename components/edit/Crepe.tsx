import toast from 'react-hot-toast'
import { encode } from '~/utils/lz'
import { Crepe } from '@milkdown/crepe'
import { editorViewCtx, parserCtx } from '@milkdown/kit/core'
import { listener, listenerCtx } from '@milkdown/kit/plugin/listener'
import { Slice } from '@milkdown/kit/prose/model'
import { Selection } from '@milkdown/kit/prose/state'
import { getMarkdown } from '@milkdown/kit/utils'
import { throttle } from '~/utils/throttle'
import { FC, MutableRefObject, useLayoutEffect, useRef } from 'react'
import { useStore } from './atom'

interface MilkdownProps {
  onChange: (markdown: string) => void
}

const CrepeEditor: FC<MilkdownProps> = ({ onChange }) => {
  const crepeRef = useRef<Crepe>(null)
  const divRef = useRef<HTMLDivElement>(null)
  const loading = useRef(false)
  const content = useStore((state) => state.markdown)
  const setCrepeAPI = useStore((state) => state.setCrepeAPI)

  useLayoutEffect(() => {
    if (!divRef.current || loading.current) return

    loading.current = true
    const crepe = new Crepe({
      root: divRef.current,
      defaultValue: content,
      featureConfigs: {
        [Crepe.Feature.LinkTooltip]: {
          onCopyLink: () => {
            toast.success('Link copied')
          }
        }
      }
    })

    crepe.editor
      .config((ctx) => {
        ctx.get(listenerCtx).markdownUpdated(
          throttle((_, markdown) => {
            onChange(markdown)
          }, 200)
        )
      })
      .use(listener)

    crepe.create().then(() => {
      ;(crepeRef as MutableRefObject<Crepe>).current = crepe
      loading.current = false
    })

    setCrepeAPI({
      loaded: true,
      onShare: () => {
        const content = crepe.editor.action(getMarkdown())
        const base64 = encode(content)

        const url = new URL(location.href)
        url.searchParams.set('text', base64)
        navigator.clipboard.writeText(url.toString()).then(() => {
          toast.success('Share link copied.')
        })
        window.history.pushState({}, '', url.toString())
      },
      update: (markdown: string) => {
        const crepe = crepeRef.current
        if (!crepe) return
        crepe.editor.action((ctx) => {
          const view = ctx.get(editorViewCtx)
          const parser = ctx.get(parserCtx)
          const doc = parser(markdown)
          if (!doc) return
          const state = view.state
          const selection = state.selection
          const { from } = selection
          let tr = state.tr
          tr = tr.replace(
            0,
            state.doc.content.size,
            new Slice(doc.content, 0, 0)
          )
          tr = tr.setSelection(Selection.near(tr.doc.resolve(from)))
          view.dispatch(tr)
        })
      }
    })

    return () => {
      if (loading.current) return
      crepe.destroy()
      setCrepeAPI({
        loaded: false,
        onShare: () => {},
        update: () => {}
      })
    }
  }, [content, onChange, setCrepeAPI, toast])

  return <div className="flex flex-col flex-1 h-full crepe" ref={divRef} />
}

export default CrepeEditor
