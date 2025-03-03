import { Editor, EditorStatus, editorViewCtx } from '@milkdown/core'
import { linkSchema } from '@milkdown/preset-commonmark'
import { useInstance } from '@milkdown/react'
import { useWidgetViewContext } from '@prosemirror-adapter/react'

import { mentionsPluginOptions } from './mentionPlugin'
import { MentionsPluginAttrs } from './utils'

const defaultDropdownComponent = () => <></>

const getDropdownListComponent = (editor: Editor | undefined) => {
  if (editor) {
    const { view: Comp = defaultDropdownComponent } = editor.ctx.get(
      mentionsPluginOptions.key
    )
    return Comp
  }
  return defaultDropdownComponent
}

export type MentionsListDropdownProps = {
  queryText: string
  onMentionItemClick: (value: string, href: string) => void
}

export const MentionsWidget: React.FC = () => {
  const { spec } = useWidgetViewContext()
  const [loading, getEditor] = useInstance()
  const editor = getEditor()

  const { queryText = '', range } = spec as NonNullable<MentionsPluginAttrs>

  const onMentionItemClick = (value: string, href: string) => {
    const editor = getEditor()
    if (editor && !loading && editor.status === EditorStatus.Created) {
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)

        const { state } = view

        const link = linkSchema.type(ctx).create({ href })
        const node = state.schema.text(`@${value}`).mark([link])
        const tr = state.tr.replaceWith(range.from, range.to, node)
        view.dispatch(tr)
      })
    }
  }

  const DropdownListComponent = getDropdownListComponent(editor)

  return (
    <DropdownListComponent
      queryText={queryText}
      onMentionItemClick={onMentionItemClick}
    />
  )
}
