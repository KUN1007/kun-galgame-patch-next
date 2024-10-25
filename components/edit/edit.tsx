import dynamic from 'next/dynamic'
import { FC, useCallback } from 'react'
import { useStore } from './atom'

const Crepe = dynamic(() => import('./Crepe'), {
  ssr: false
})

export const Editor: FC = () => {
  const { cmAPI, focus, setMarkdown } = useStore()

  const onMilkdownChange = useCallback(
    (markdown: string) => {
      const lock = focus === 'cm'
      if (lock) return

      cmAPI.update(markdown)
      setMarkdown(markdown)
    },
    [cmAPI, focus, setMarkdown]
  )

  return <Crepe onChange={onMilkdownChange} />
}
