import { Card, CardBody, CardHeader } from '@nextui-org/card'
import { Divider } from '@nextui-org/divider'
import { UserAvatar } from './Avatar'
import { Username } from './Username'
import { Bio } from './Bio'
import { Email } from './Email'
import { Password } from './Password'

export const UserSettings = () => {
  return (
    <div className="w-full my-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-medium">账户设置</h1>
        <p className="text-default-500">您可以在此处设置您的账户信息</p>
      </div>
      <Divider className="my-8" />

      <div className="max-w-3xl m-auto space-y-8">
        <UserAvatar />
        <Username />
        <Bio />
        <Email />
        <Password />
      </div>
    </div>
  )
}
