'use client'

import { Button, Input, Link } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import { useKunMilkdownStore } from '~/store/milkdownStore'
import toast from 'react-hot-toast'
import { kunFetchGet } from '~/utils/kunFetch'
import { VNDBRegex } from '~/utils/validate'
import type { VNDBResponse } from '../VNDB'

interface Props {
  errors: string | undefined
}

export const VNDBInput = ({ errors }: Props) => {
  const { data, setData } = useCreatePatchStore()
  const refreshMilkdownContent = useKunMilkdownStore(
    (state) => state.refreshMilkdownContent
  )

  const handleCheckDuplicate = async () => {
    if (!VNDBRegex.test(data.vndbId)) {
      toast.error('您输入的 VNDB ID 格式无效')
      return
    }

    const res = await kunFetchGet<KunResponse<{}>>('/edit/duplicate', {
      vndbId: data.vndbId
    })
    if (typeof res === 'string') {
      toast.error('游戏重复, 该游戏已经有人发布过了')
      return
    } else {
      toast.success('检测完成, 该游戏并未重复!')
    }

    toast('正在从 VNDB 获取数据...')
    const vndbResponse = await fetch(`https://api.vndb.org/kana/vn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filters: ['id', '=', data.vndbId],
        fields:
          'title, titles.lang, titles.title, description, aliases, released'
      })
    })

    const vndbData: VNDBResponse = await vndbResponse.json()
    const allTitles = vndbData.results.flatMap((vn) => {
      const jaTitle = vn.titles.find((t) => t.lang === 'ja')?.title
      const titlesArray = [
        ...(jaTitle ? [jaTitle] : []),
        vn.title,
        ...vn.titles.filter((t) => t.lang !== 'ja').map((t) => t.title),
        ...vn.aliases
      ]
      return titlesArray
    })

    setData({
      ...data,
      alias: allTitles,
      introduction: vndbData.results[0].description,
      released: vndbData.results[0].released
    })

    refreshMilkdownContent()
    toast.success('获取数据成功! 已为您自动添加游戏别名')
  }

  return (
    <div className="flex flex-col w-full space-y-2">
      <h2 className="text-xl">一、VNDB ID</h2>
      <Input
        variant="underlined"
        labelPlacement="outside"
        placeholder="请输入 VNDB ID, 例如 v19658"
        value={data.vndbId}
        onChange={(e) => setData({ ...data, vndbId: e.target.value })}
        isInvalid={!!errors}
        errorMessage={errors}
      />
      <p className="text-sm ">
        提示: VNDB ID 需要 VNDB 官网 (vndb.org)
        获取，当进入对应游戏的页面，游戏页面的 URL (形如
        https://vndb.org/v19658) 中的 v19658 就是 VNDB ID
      </p>
      <p className="text-sm text-default-500">
        我们强烈建议您填写 VNDB ID 以确保游戏不重复, 获取 VNDB ID 将会{' '}
        <b>覆盖您当前编写的介绍</b>, 并且自动生成游戏发售日期与游戏别名
      </p>
      <p className="text-sm text-default-500">
        <b>
          您可以不填写 VNDB ID 发布游戏, 但是您需要自行检查游戏是否重复
          (如果游戏发生重复, 我们会通知您自行删除)
        </b>
      </p>
      <Link
        isExternal
        target="_blank"
        className="flex"
        underline="hover"
        href="https://www.kungal.com/zh-cn/topic/1040"
        size="sm"
      >
        如何通过 VNDB 检索 Galgame?
      </Link>
      <div className="flex items-center text-sm">
        {data.vndbId && (
          <Button
            className="mr-4"
            color="primary"
            size="sm"
            onPress={handleCheckDuplicate}
          >
            检查重复
          </Button>
        )}
      </div>
    </div>
  )
}
