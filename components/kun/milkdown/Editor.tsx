import { KunEditorProvider } from './EditorProvider'
import { MilkdownProvider } from '@milkdown/react'
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/react'

interface KunEditorProps {
  valueMarkdown: string
  saveMarkdown: (markdown: string) => void
}

export const KunEditor = (props: KunEditorProps) => {
  return (
    <MilkdownProvider>
      <ProsemirrorAdapterProvider>
        <KunEditorProvider {...props} />
      </ProsemirrorAdapterProvider>
    </MilkdownProvider>
  )
}
