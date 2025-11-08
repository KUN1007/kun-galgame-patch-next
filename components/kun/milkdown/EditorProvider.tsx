'use client'

import { useEffect } from 'react'

import { defaultValueCtx, Editor, rootCtx } from '@milkdown/core'
import { Milkdown, useEditor } from '@milkdown/react'
import { commonmark } from '@milkdown/preset-commonmark'
import { gfm } from '@milkdown/preset-gfm'
import { history } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { clipboard } from '@milkdown/plugin-clipboard'
import { indent } from '@milkdown/plugin-indent'
import { trailing } from '@milkdown/plugin-trailing'
import { upload, uploadConfig } from '@milkdown/plugin-upload'
import { kunUploader, kunUploadWidgetFactory } from './plugins/uploader'
import { replaceAll } from '@milkdown/utils'
import { automd } from '@milkdown/plugin-automd'
import { usePluginViewFactory } from '@prosemirror-adapter/react'

import { KunMilkdownPluginsMenu } from './plugins/Menu'
import { KunLoading } from '../Loading'
import { useKunMilkdownStore } from '~/store/milkdownStore'
import {
  MentionsListDropdown,
  slash
} from './plugins/mention/MentionsListDropdown'
import {
  stopLinkCommand,
  linkCustomKeymap
} from './plugins/stop-link/stopLinkPlugin'
import {
  placeholderPlugin,
  placeholderCtx
} from './plugins/placeholder/placeholderPlugin'

type Props = {
  valueMarkdown: string
  saveMarkdown: (markdown: string) => void
  placeholder?: string
  language: Language
}

export const KunEditorProvider = ({
  valueMarkdown,
  saveMarkdown,
  placeholder,
  language
}: Props) => {
  const refreshContentStatus = useKunMilkdownStore(
    (state) => state.data.refreshContentStatus
  )

  const pluginViewFactory = usePluginViewFactory()

  const editor = useEditor((root) =>
    Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, root)
        ctx.set(defaultValueCtx, valueMarkdown)
        ctx.set(placeholderCtx.key, placeholder ?? '')

        const listener = ctx.get(listenerCtx)
        listener.markdownUpdated((_, markdown) => {
          saveMarkdown(markdown)
        })

        ctx.set(slash.key, {
          view: pluginViewFactory({
            component: MentionsListDropdown
          })
        })

        ctx.update(uploadConfig.key, (prev) => ({
          ...prev,
          uploader: kunUploader,
          uploadWidgetFactory: kunUploadWidgetFactory
        }))
      })
      .use(history)
      .use(commonmark)
      .use(gfm)
      .use(listener)
      .use(clipboard)
      .use(indent)
      .use(trailing)
      .use(upload)
      .use(automd)
      .use(
        [
          stopLinkCommand,
          linkCustomKeymap,
          placeholderCtx,
          placeholderPlugin,
          slash
        ].flat()
      )
  )

  useEffect(() => {
    if (editor.get()) {
      requestAnimationFrame(() => {
        editor.get()?.action(replaceAll(valueMarkdown, true))
      })
    }
  }, [refreshContentStatus, language])

  return (
    <div className="min-h-64" onClick={(e) => e.stopPropagation()}>
      <KunMilkdownPluginsMenu editorInfo={editor} />
      <div className="relative mt-2">
        <Milkdown />
      </div>
      {editor.loading && (
        <KunLoading className="min-h-48" hint="正在加载编辑器" />
      )}
    </div>
  )
}
