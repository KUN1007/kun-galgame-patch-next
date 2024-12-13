'use client'

import { Link } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { Editor } from '~/components/kun/milkdown/PatchEditor'

interface Props {
  errors: string | undefined
}

export const PatchIntroduction = ({ errors }: Props) => {
  const { data } = useCreatePatchStore()

  return (
    <div className="space-y-2">
      <h2 className="text-xl">四、游戏介绍</h2>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}
      <p className="text-sm text-default-500">
        自动获取的英语介绍仅供参考, 如果您通过搜索获取到游戏的简体中文介绍,
        您可以覆盖该英语介绍
      </p>
      <p className="text-sm text-default-500">
        您也可以使用{' '}
        <Link
          isExternal
          size="sm"
          href={`https://cn.bing.com/translator?text=${data.introduction}&from=en&to=zh-Hans`}
        >
          微软翻译
        </Link>{' '}
        /{' '}
        <Link
          isExternal
          size="sm"
          href={`https://www.deepl.com/zh/translator#en/zh-hans/${data.introduction}`}
        >
          DeepL
        </Link>{' '}
        等渠道将该英语直接翻译后使用
      </p>
      <Editor storeName="patchCreate" />
    </div>
  )
}
