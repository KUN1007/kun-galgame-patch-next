'use client'

import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card'
import { Checkbox } from '@heroui/checkbox'
import { MESSAGE_TYPE, MESSAGE_TYPE_MAP } from '~/constants/message'
import { useUserStore } from '~/store/userStore'

export const MessageSettings = () => {
  const { user, toggleMutedMessageType } = useUserStore()

  return (
    <Card className="w-full text-sm">
      <CardHeader>
        <h2 className="text-xl font-medium">消息通知设置</h2>
      </CardHeader>
      <CardBody className="py-0 space-y-4 overflow-y-visible">
        <div>
          <p>
            选择您想要接收通知的消息类型, 如果下面的选择您无法点击,
            请尝试重置网站数据
          </p>
        </div>
        <div className="grid h-full grid-cols-2 gap-3">
          {MESSAGE_TYPE.filter((t) => t).map((type) => (
            <Checkbox
              key={type}
              isSelected={!user.mutedMessageTypes?.includes(type)}
              onValueChange={() => toggleMutedMessageType(type)}
              color="primary"
              isDisabled={type === 'system'}
            >
              {MESSAGE_TYPE_MAP[type]}
            </Checkbox>
          ))}
        </div>
      </CardBody>
      <CardFooter>
        <p className="text-default-500">
          消息通知设置将会保存在本地, 不会同步到服务器
        </p>
      </CardFooter>
    </Card>
  )
}
