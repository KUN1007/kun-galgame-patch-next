'use client'

import { useState } from 'react'
import { KunHeader } from '~/components/kun/Header'
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Progress,
  Divider,
  Chip
} from '@nextui-org/react'
import { CheckCircle2, CircleSlash, Trophy } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { api } from '~/lib/trpc-client'
import { useUserStore } from '~/store/providers/user'
import { useErrorHandler } from '~/hooks/useErrorHandler'

interface Props {
  count: number
}

export const ApplyContainer = ({ count }: Props) => {
  const router = useRouter()
  const user = useUserStore((state) => state.user)
  const setUser = useUserStore((state) => state.setUser)
  const [applying, setApplying] = useState(false)

  const progress = Math.min((count / 3) * 100, 100)
  const canApply = count >= 3

  const handleApply = async () => {
    setApplying(true)
    const res = await api.app.applyForCreator.mutate()
    useErrorHandler(res, () => {
      setUser({ ...user, role: 2 })
      router.refresh()
    })
    setApplying(false)
  }

  return (
    <div className="w-full px-4 py-8 mx-auto">
      <KunHeader
        name="申请成为创作者"
        description="申请成为创作者以获得使用本站存储的权限"
      />

      <Card className="max-w-xl mx-auto mt-8 ">
        <CardHeader>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Trophy className="text-warning" />
            创作者申请进度
          </h2>
        </CardHeader>
        <CardBody className="gap-6">
          <div className="flex items-center justify-between">
            <p className="text-default-500">发布补丁进度: {count}/3</p>
            <Chip
              color={canApply ? 'success' : 'warning'}
              variant="flat"
              startContent={
                canApply ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <CircleSlash className="w-4 h-4" />
                )
              }
            >
              {canApply ? '已达到申请条件' : '请继续努力哦'}
            </Chip>
          </div>

          <Progress
            size="md"
            radius="sm"
            classNames={{
              base: 'max-w-full',
              indicator: 'bg-gradient-to-r from-danger-500 to-warning-500'
            }}
            value={progress}
            showValueLabel={true}
            aria-label="发布补丁进度"
          />

          <Divider />

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">申请条件</h3>
              <p className="text-default-500">在本站合法发布三个补丁</p>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-semibold">当前状态</h3>
              <p className="text-default-500">
                {canApply
                  ? '恭喜！您已经达到申请条件，可以立即申请成为创作者'
                  : `您还需要发布 ${3 - count} 个补丁才能申请成为创作者`}
              </p>
            </div>
          </div>

          <Button
            color="primary"
            size="lg"
            startContent={<CheckCircle2 className="w-5 h-5" />}
            isLoading={applying}
            isDisabled={!canApply || applying}
            onClick={handleApply}
            className="w-full"
          >
            {applying ? '申请处理中...' : '申请成为创作者'}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
