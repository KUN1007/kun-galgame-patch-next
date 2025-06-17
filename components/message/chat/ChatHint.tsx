'use client'

import { Button, Card, CardBody, Link, useDisclosure } from '@heroui/react'
import { GitHub } from '~/components/kun/icons/GitHub'
import {
  MessageSquareDashed,
  Plus,
  MessageCircleQuestion,
  Star,
  PartyPopper
} from 'lucide-react'
import { CreateGroupChatModal } from './CreateGroupChatModal'

export const ChatHint = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <Card className="h-full w-full w-full">
      <CardBody className="flex flex-col items-center gap-8 p-8 text-center md:p-12">
        <div className="flex flex-col items-center gap-4">
          <MessageSquareDashed
            className="text-primary"
            size={48}
            strokeWidth={1.5}
          />
          <h1 className="text-2xl font-bold text-default-800">
            欢迎来到我们的聊天室
          </h1>
          <p className="text-default-500">
            在这里, 您可以与本站的任何用户私聊, 也可以创建 / 加入群组进行交流。
          </p>
        </div>

        <div className="w-full space-y-5 text-left md:w-4/5">
          <div className="flex items-start gap-3">
            <PartyPopper className="mt-1 h-5 w-5 flex-shrink-0 text-warning" />
            <div>
              <p className="font-semibold text-default-700">新功能尝鲜</p>
              <p className="text-sm text-default-500">
                聊天系统刚刚上线，我们正在努力完善它，难免会有一些 BUG。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircleQuestion className="mt-1 h-5 w-5 flex-shrink-0 text-secondary" />
            <div>
              <p className="font-semibold text-default-700">期待您的反馈</p>
              <p className="text-sm text-default-500">
                如果碰到任何问题，请在{' '}
                <Link
                  isExternal
                  showAnchorIcon
                  href="https://www.kungal.com/topic/1820"
                  className="font-semibold"
                >
                  我们的论坛
                </Link>{' '}
                中告诉我们。
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <GitHub className="mt-1 h-5 w-5 flex-shrink-0 text-default-600" />
            <div>
              <p className="font-semibold text-default-700">为我们点亮 Star</p>
              <p className="text-sm text-default-500">
                网站完全开源，如果喜欢，请给我们的{' '}
                <Link
                  isExternal
                  showAnchorIcon
                  href="https://github.com/KUN1007/kun-galgame-patch-next"
                  className="font-semibold"
                >
                  GitHub 仓库
                </Link>{' '}
                一颗{' '}
                <Star className="inline h-4 w-4 fill-yellow-400 text-yellow-500" />{' '}
                以示支持！
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 w-full md:w-auto">
          <Button
            fullWidth
            color="primary"
            variant="solid"
            size="lg"
            className="font-bold shadow-lg shadow-primary/40"
            startContent={<Plus size={20} />}
            onPress={onOpen}
          >
            创建或加入群聊
          </Button>
        </div>
      </CardBody>

      <CreateGroupChatModal isOpen={isOpen} onClose={onClose} />
    </Card>
  )
}
