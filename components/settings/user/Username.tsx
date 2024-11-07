'use client'

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { useUserStore } from '~/store/userStore'

export const Username = () => {
  const { user } = useUserStore()

  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">用户名</h2>
      </CardHeader>
      <CardBody className="py-0 space-y-4">
        <div>
          <p>这是您的用户名设置, 您的用户名是唯一的</p>
        </div>
        <Input label="用户名" autoComplete="username" />
      </CardBody>

      <CardFooter>
        <p className="text-gray-500">用户名长度最大为 16, 可以是任意字符</p>

        <Button color="primary" variant="solid" className="ml-auto">
          保存
        </Button>
      </CardFooter>
    </Card>
  )
}
