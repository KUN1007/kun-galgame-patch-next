// Reference: https://github.com/zgrybus/milkdown-mentions-plugin

import { editorViewCtx } from '@milkdown/core'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { DecorationSet } from '@milkdown/prose/view'
import { $ctx, $prose } from '@milkdown/utils'
import { useWidgetViewFactory } from '@prosemirror-adapter/react'
import { useMemo } from 'react'

import {
  MentionsPluginAttrs,
  computeStateFromSelection,
  getInitState
} from './utils'
import { MentionsListDropdownProps, MentionsWidget } from './MentionsWidget'

export type MentionsOptions = {
  view?: React.FC<MentionsListDropdownProps>
}

export const mentionsPluginOptions = $ctx<MentionsOptions, 'mentionsOptions'>(
  {},
  'mentionsOptions'
)

export const mentionsPlugin = () => {
  const widgetViewFactory = useWidgetViewFactory()

  const proseMentionsPlugin = useMemo(
    () =>
      $prose((ctx) => {
        const key = new PluginKey<MentionsPluginAttrs>('MENTIONS_PLUGIN')
        return new Plugin({
          key,
          state: {
            init() {
              return getInitState()
            },
            apply(tr) {
              const newState = getInitState()
              const { selection } = tr

              if (selection.from !== selection.to) {
                return newState
              }

              const stateFromSelection = computeStateFromSelection(
                ctx,
                selection
              )

              if (stateFromSelection) {
                return stateFromSelection
              }

              return newState
            }
          },
          props: {
            decorations(state) {
              const newState = key.getState(state)

              if (newState?.queryText) {
                const { range } = newState
                const editorView = ctx.get(editorViewCtx)

                const start = editorView.coordsAtPos(range.from)
                const box = editorView.dom.getBoundingClientRect()

                const height = start.bottom - start.top

                const left = start.left - box.left
                const top = start.top - box.top + height

                const div = document.createElement('div')
                div.style.position = 'absolute'
                div.style.inset = '0 auto auto 0'
                div.style.transform = `translate(${left}px, ${top}px)`
                div.style.zIndex = '100000'

                const createWidget = widgetViewFactory({
                  as: div,
                  component: MentionsWidget
                })

                return DecorationSet.create(state.tr.doc, [
                  createWidget(0, newState)
                ])
              }

              return DecorationSet.empty
            }
          }
        })
      }),
    []
  )

  const mentionsPlugin = useMemo(
    () => [mentionsPluginOptions, proseMentionsPlugin],
    []
  )

  return mentionsPlugin
}
