'use client'

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { Mail } from 'lucide-react'
import { useUserStore } from '~/store/userStore'

export const Email = () => {
  const { user } = useUserStore()

  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">邮箱</h2>
      </CardHeader>
      <CardBody className="py-0 space-y-4">
        <div>
          <p>这是您的邮箱设置, 您的邮箱将会被用于恢复您的密码</p>
        </div>
        <Input
          type="email"
          placeholder="moe@moyu.moe"
          startContent={
            <Mail className="flex-shrink-0 text-2xl pointer-events-none text-default-400" />
          }
        />
      </CardBody>

      <CardFooter className="flex-wrap">
        <p className="text-gray-500">
          您的新邮箱在设置后, 将会收到一封确认邮件, 请在确认邮件的链接中进行验证
        </p>

        <Button color="primary" variant="solid" className="ml-auto">
          保存
        </Button>
      </CardFooter>
    </Card>
  )
}
