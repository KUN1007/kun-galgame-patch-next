'use client'

import { Button, Tooltip } from '@nextui-org/react'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

export const EditButton = () => {
  const router = useRouter()

  return (
    <Tooltip
      content={
        <div className="px-1 py-2">
          <div className="font-bold text-small">编辑游戏信息</div>
          <div className="text-tiny">任何人都可以编辑游戏信息</div>
          <div className="text-tiny">但需要提交更新请求</div>
        </div>
      }
    >
      <Button
        variant="bordered"
        isIconOnly
        aria-label="编辑游戏信息"
        onPress={() => router.push('/edit/rewrite')}
      >
        <Pencil className="size-4" />
      </Button>
    </Tooltip>
  )
}
