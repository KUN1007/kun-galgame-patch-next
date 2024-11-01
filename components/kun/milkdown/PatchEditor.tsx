import dynamic from 'next/dynamic'
import { MilkdownProvider } from '@milkdown/react'
import { FC } from 'react'
import { useEditStore } from '~/store/editStore'

const KunEditor = dynamic(() => import('./Editor'), {
  ssr: false
})

export const Editor: FC = () => {
  const { data, setData } = useEditStore()

  const saveMarkdown = (markdown: string) => {
    setData({ ...data, introduction: markdown })
  }

  return (
    <MilkdownProvider>
      <KunEditor
        valueMarkdown={data.introduction}
        saveMarkdown={saveMarkdown}
      />
    </MilkdownProvider>
  )
}
