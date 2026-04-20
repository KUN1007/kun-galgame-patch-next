'use client'

import { Tabs, Tab, Link } from '@heroui/react'
import { Editor } from '~/components/kun/milkdown/PatchEditor'
import { useState } from 'react'

interface Props {
  storeName: 'patchCreate' | 'patchRewrite'
  errors?: string
  initialLang?: Language
  getCurrentText?: () => string
}

export const TabbedIntroduction = ({
  storeName,
  errors,
  initialLang = 'zh-cn',
  getCurrentText
}: Props) => {
  const [lang, setLang] = useState<Language>(initialLang)
  const currentText = getCurrentText ? getCurrentText() : ''

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xl">简介</h2>

        {currentText && (
          <div className="hidden md:flex gap-2 text-sm text-default-500">
            <span>辅助翻译：</span>
            <Link
              isExternal
              size="sm"
              href={`https://cn.bing.com/translator?text=${encodeURIComponent(currentText)}&from=auto&to=zh-Hans`}
            >
              Bing 翻译
            </Link>
            <span>/</span>
            <Link
              isExternal
              size="sm"
              href={`https://www.deepl.com/zh/translator#auto/zh/${encodeURIComponent(currentText)}`}
            >
              DeepL
            </Link>
          </div>
        )}
      </div>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}

      <p className="text-sm text-default-500">写一个就可以, 不写也行, 随便你</p>

      <Tabs
        aria-label="language-tabs"
        selectedKey={lang}
        onSelectionChange={(k) => setLang(k as Language)}
        variant="underlined"
        radius="full"
        className="mb-2"
      >
        <Tab key="zh-cn" title="中文">
          <Editor storeName={storeName} lang="zh-cn" />
        </Tab>
        <Tab key="ja-jp" title="日文">
          <Editor storeName={storeName} lang="ja-jp" />
        </Tab>
        <Tab key="en-us" title="英文">
          <Editor storeName={storeName} lang="en-us" />
        </Tab>
      </Tabs>
    </div>
  )
}
