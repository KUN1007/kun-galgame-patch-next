'use client'

import { Card, CardHeader, CardBody, CardFooter } from '@nextui-org/card'
import { Input } from '@nextui-org/input'
import { Button } from '@nextui-org/button'
import { Divider } from '@nextui-org/divider'
import { Link } from '@nextui-org/link'
import { useUserStore } from '~/store/userStore'

export const Password = () => {
  const { user } = useUserStore()

  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">密码</h2>
      </CardHeader>
      <CardBody className="py-0 space-y-4">
        <div>
          <p>
            这是您的密码, 您需要输入旧密码以更改新密码, 密码长度最多 1000 个字符
          </p>
        </div>
        <Input type="text" label="旧密码" autoComplete="old-password" />
        <Input type="text" label="新密码" autoComplete="new-password" />
      </CardBody>

      <CardFooter>
        <p className="text-gray-500">
          您的邮箱在设置后, 需要经过验证码检测才会生效
        </p>

        <Button color="primary" variant="solid" className="ml-auto">
          保存
        </Button>
      </CardFooter>

      <Divider />
      <CardFooter>
        <Link showAnchorIcon href="/auth/forgot">
          忘记密码?
        </Link>
      </CardFooter>
    </Card>
  )
}
