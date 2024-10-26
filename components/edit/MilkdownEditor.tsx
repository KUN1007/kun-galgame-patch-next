import dynamic from 'next/dynamic'
import { FC, useCallback } from 'react'
import { useEditorStore } from '~/store/editorStore'

const Crepe = dynamic(() => import('./Crepe'), {
  ssr: false
})

export const Editor: FC = () => {
  const { focus, setMarkdown } = useEditorStore()

  const onMilkdownChange = useCallback(
    (markdown: string) => {
      setMarkdown(markdown)
    },
    [focus, setMarkdown]
  )

  return <Crepe onChange={onMilkdownChange} />
}
