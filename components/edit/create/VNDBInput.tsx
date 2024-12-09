'use client'

import { Button, Input, Link } from '@nextui-org/react'
import { useCreatePatchStore } from '~/store/editStore'
import toast from 'react-hot-toast'
import { kunFetchGet } from '~/utils/kunFetch'
import type { VNDBResponse } from '../VNDB'

interface Props {
  errors: string | undefined
}

export const VNDBInput = ({ errors }: Props) => {
  const { data, setData } = useCreatePatchStore()

  const handleCheckDuplicate = async () => {
    const regex = new RegExp(/^v\d{1,6}$/)
    if (!regex.test(data.vndbId)) {
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

    toast.promise(
      (async () => {
        const vndbResponse = await fetch(`https://api.vndb.org/kana/vn`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            filters: ['id', '=', data.vndbId],
            fields: 'title, titles.title, aliases, released'
          })
        })

        if (!vndbResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const vndbData: VNDBResponse = await vndbResponse.json()
        const allTitles = vndbData.results.flatMap((vn) => {
          const titlesArray = [
            vn.title,
            ...vn.titles.map((t) => t.title),
            ...vn.aliases
          ]
          return titlesArray
        })

        setData({
          ...data,
          alias: allTitles,
          released: vndbData.results[0].released
        })
      })(),
      {
        loading: '正在从 VNDB 获取数据',
        success: '获取数据成功! 已为您自动添加游戏别名!',
        error: '从 VNDB 获取数据错误'
      }
    )
  }

  return (
    <div className="flex flex-col w-full space-y-2">
      <Input
        isRequired
        variant="underlined"
        labelPlacement="outside"
        label="VNDB ID"
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
      <div className="flex items-center text-sm">
        {data.vndbId && (
          <Button
            className="mr-4"
            color="primary"
            size="sm"
            onClick={handleCheckDuplicate}
          >
            检查重复
          </Button>
        )}
      </div>

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
    </div>
  )
}
