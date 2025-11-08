'use client'

import { Button, Card, CardBody, Input, Link } from '@heroui/react'
import { useCreatePatchStore } from '~/store/editStore'
import toast from 'react-hot-toast'
import { kunFetchGet } from '~/utils/kunFetch'
import { VNDBRegex } from '~/utils/validate'
import { useState } from 'react'
import { kunMoyuMoe } from '~/config/moyu-moe'

interface Props {
  errors: string | undefined
}

export const VNDBInput = ({ errors }: Props) => {
  const [existPatchId, setExistPatchId] = useState(0)
  const { data, setData } = useCreatePatchStore()

  const handleCheckDuplicate = async () => {
    if (!VNDBRegex.test(data.vndbId)) {
      toast.error('您输入的 VNDB ID 格式无效')
      return
    }

    const res = await kunFetchGet<KunResponse<{ patchId: number }>>(
      '/edit/duplicate',
      { vndbId: data.vndbId }
    )
    if (typeof res !== 'string' && res.patchId) {
      toast.error(
        '游戏重复, 该游戏已经有人发布过了, 请直接点击下面的链接前往游戏页面创建补丁资源即可'
      )
      setExistPatchId(res.patchId)
      return
    } else {
      toast.success('检测完成, 该游戏并未重复!')
    }
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
      <p className="text-sm font-bold">
        提示: VNDB ID 需要进入{' '}
        <Link size="sm" href="https://vndb.org/" isExternal showAnchorIcon>
          VNDB 官网 (vndb.org)
        </Link>
        获取，当进入对应游戏的页面，游戏页面的 URL (形如
        https://vndb.org/v19658) 中的 v19658 就是 VNDB ID
      </p>
      <p className="text-sm text-default-500">
        <b>
          您可以不填写 VNDB ID 发布游戏, 但是您需要自行检查游戏是否重复
          (如果游戏发生重复, 我们会通知您自行删除)
        </b>
      </p>
      <p className="text-sm font-bold text-danger">
        注意, 没有 VNDB ID 的游戏将会没有任何介绍和标签,
        直到我们建成数据库之后才可以编辑标签、角色等数据, 无 VNDB ID
        只能在重新编辑页面编辑游戏名和介绍
      </p>
      <Link
        isExternal
        target="_blank"
        className="flex"
        underline="hover"
        href="https://www.kungal.com/topic/1040"
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

      {existPatchId !== 0 && (
        <Card>
          <CardBody>
            <b className="text-danger-600">
              游戏重复, 该游戏已经有人发布过了,
              请直接点击下面的链接前往游戏页面创建补丁资源即可
            </b>
            <Link href={`/patch/${existPatchId}/resource`} underline="always">
              {`${kunMoyuMoe.domain.main}/patch/${existPatchId}/resource`}
            </Link>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
