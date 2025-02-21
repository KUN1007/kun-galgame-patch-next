'use client'

import { Switch, Card, CardBody, CardFooter, Divider } from '@nextui-org/react'
import { useState } from 'react'
import { Ban } from 'lucide-react'
import { kunFetchPut } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

interface Props {
  enableCommentVerify: boolean
}

export const EnableCommentVerify = ({ enableCommentVerify }: Props) => {
  const [isEnable, setIsEnable] = useState(enableCommentVerify)

  const handleSwitch = async (value: boolean) => {
    const res = await kunFetchPut<KunResponse<{}>>('/admin/setting/comment', {
      enableCommentVerify: value
    })
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      setIsEnable(value)
      toast.success('应用设置成功')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">启用发送评论验证</h3>
              <p className="text-small text-default-500">
                启用后用户发送评论必须进行人机验证
              </p>
            </div>
            <Switch
              isSelected={isEnable}
              onValueChange={handleSwitch}
              size="lg"
              color="danger"
              startContent={<Ban className="w-4 h-4" />}
            />
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="text-sm text-default-500">
          点击开关后设置将会立即生效, 该设置将防止 spam 用户使用脚本恶意刷评论
        </CardFooter>
      </Card>
    </div>
  )
}
