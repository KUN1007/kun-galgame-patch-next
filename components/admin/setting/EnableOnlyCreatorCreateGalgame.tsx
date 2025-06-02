'use client'

import { Switch, Card, CardBody, CardFooter, Divider } from "@heroui/react"
import { useState } from 'react'
import { Ban } from 'lucide-react'
import { kunFetchPut } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

interface Props {
  enableOnlyCreatorCreate: boolean
}

export const EnableOnlyCreatorCreateGalgame = ({
  enableOnlyCreatorCreate
}: Props) => {
  const [isEnable, setIsEnable] = useState(enableOnlyCreatorCreate)

  const handleSwitch = async (value: boolean) => {
    const res = await kunFetchPut<KunResponse<{}>>('/admin/setting/creator', {
      enableOnlyCreatorCreate: value
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
              <h3 className="text-lg font-semibold">
                禁止创作者以外的用户创建项目
              </h3>
              <p className="text-small text-default-500">
                禁止创作者以外的用户创建, 更改 Galgame, 会社, 标签等
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
          点击后设置将会立即生效, 这项设置对于防止 spam 用户恶意创建项目很有用
        </CardFooter>
      </Card>
    </div>
  )
}
