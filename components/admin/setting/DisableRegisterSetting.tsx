'use client'

import { Switch, Card, CardBody, CardFooter, Divider } from '@nextui-org/react'
import { useState } from 'react'
import { Ban } from 'lucide-react'
import { kunFetchPut } from '~/utils/kunFetch'
import toast from 'react-hot-toast'

interface Props {
  disableRegister: boolean
}

export const DisableRegisterSetting = ({ disableRegister }: Props) => {
  const [isDisable, setIsDisable] = useState(disableRegister)

  const handleSwitch = async (value: boolean) => {
    const res = await kunFetchPut<KunResponse<{}>>('/admin/setting/register', {
      disableRegister: value
    })
    if (typeof res === 'string') {
      toast.error(res)
    } else {
      setIsDisable(value)
      toast.success('应用设置成功')
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">禁止注册</h3>
              <p className="text-small text-default-500">
                是否禁止网站新用户注册
              </p>
            </div>
            <Switch
              isSelected={isDisable}
              onValueChange={handleSwitch}
              size="lg"
              color="danger"
              startContent={<Ban className="w-4 h-4" />}
            />
          </div>
        </CardBody>
        <Divider />
        <CardFooter className="text-sm text-default-500">
          点击禁止注册设置将会立即生效
        </CardFooter>
      </Card>
    </div>
  )
}
