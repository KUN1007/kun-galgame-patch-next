'use client'

import { Switch } from '@nextui-org/react'
import { useRewritePatchStore } from '~/store/rewriteStore'
import { GALGAME_AGE_LIMIT_MAP } from '~/constants/galgame'

interface Props {
  errors: string | undefined
}

export const ContentLimit = ({ errors }: Props) => {
  const { data, setData } = useRewritePatchStore()

  return (
    <div className="space-y-2">
      <h2 className="text-xl">页面内容分级</h2>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}
      <p className="text-sm text-default-500">
        默认游戏页面是 SFW (内容安全, 可以在公告场合打开),
        如果您觉得游戏名、预览图、介绍等过于虎狼 (例如:
        用淫乱喷雾强制贞淑人妻们发情), 页面完全没有办法在公共场合展示,
        请将内容分级为 NSFW (内容可能有 R18, 会导致社死)
      </p>
      <p className="text-sm text-default-500">
        SFW 的浏览量会高两到三倍,
        因此请您尽量保证游戏封面、游戏名、游戏介绍等可以在公共场合展示
      </p>

      <Switch
        defaultSelected
        color="danger"
        size="lg"
        isSelected={data.contentLimit === 'nsfw'}
        onValueChange={(value) => {
          if (value) {
            setData({ ...data, contentLimit: 'nsfw' })
          } else {
            setData({ ...data, contentLimit: 'sfw' })
          }
        }}
      >
        {GALGAME_AGE_LIMIT_MAP[data.contentLimit]}
      </Switch>
    </div>
  )
}
