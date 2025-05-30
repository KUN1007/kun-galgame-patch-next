'use client'

import { Switch, Alert, Image } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { GALGAME_AGE_LIMIT_MAP } from '~/constants/galgame'

interface Props {
  errors: string | undefined
}

export const ContentLimit = ({ errors }: Props) => {
  const { data, setData } = useCreatePatchStore()

  return (
    <div className="space-y-2">
      <h2 className="text-xl">六、页面内容分级</h2>
      {errors && <p className="text-xs text-danger-500">{errors}</p>}
      <p className="text-sm text-default-500">
        默认游戏页面是 SFW (内容安全, 可以在公告场合打开),
        如果您觉得游戏名、预览图、介绍等过于虎狼 (例如:
        用淫乱喷雾强制贞淑人妻们发情), 页面完全没有办法在公共场合展示,
        请将内容分级为 NSFW (内容可能有 R18, 会导致社死)
      </p>
      <p className="text-sm text-default-500">
        NSFW 指的是游戏页面含有不适合在公共场合展示的内容,
        而不是指的游戏本身含有 R18 内容
      </p>
      <p className="text-sm text-default-500">
        SFW 的浏览量会高两到三倍,
        因此请您尽量保证游戏封面、游戏名、游戏介绍等可以在公共场合展示
      </p>
      <Alert
        color="danger"
        title="再次请大家注意 NSFW 问题"
        description="网站目前的 NSFW 认定标准可能比较苛刻, 看起来不能在公司报告大会上放在 PPT 里展示的游戏都是 NSFW ,封面需要打码才能放上去的一律算 NSFW, 总之就是越严越好，可以错杀不可以放过，因为会导致网站违反 Google 或 Bing 的条款"
      />
      <div className="pb-6">
        <p className="text-sm text-default-500">
          例如下面两张图就算作 NSFW 的游戏, 有 NSFW 的游戏名或介绍等等也算作
          NSFW
        </p>
        <div className="flex gap-2">
          <Image src="/edit/1.avif" width={200} />
          <Image src="/edit/2.avif" width={200} />
        </div>
      </div>

      <p>注意这个 NSFW 开关, 越严越好, 只要有一点不对立即设置为 NSFW</p>
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
