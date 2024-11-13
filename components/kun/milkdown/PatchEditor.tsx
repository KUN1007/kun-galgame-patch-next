import dynamic from 'next/dynamic'
import { MilkdownProvider } from '@milkdown/react'
import { FC } from 'react'
import { useCreatePatchStore } from '~/store/editStore'

const KunEditor = dynamic(() => import('./Editor'), {
  ssr: false
})

export const Editor: FC = () => {
  const { getData, setData } = useCreatePatchStore()

  const saveMarkdown = (markdown: string) => {
    setData({ ...getData(), introduction: markdown })
  }

  return (
    <MilkdownProvider>
      <KunEditor
        valueMarkdown={getData().introduction}
        saveMarkdown={saveMarkdown}
      />
    </MilkdownProvider>
  )
}
