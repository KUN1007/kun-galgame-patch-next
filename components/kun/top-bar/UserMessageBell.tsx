'use client'

import { Button } from '@nextui-org/button'
import { Link } from '@nextui-org/link'
import { Tooltip } from '@nextui-org/tooltip'
import { Bell, BellRing } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { bellShakeVariants, dotVariants } from '~/motion/bell'
import { useRouter } from 'next-nprogress-bar'
import { useUserStore } from '~/store/userStore'

interface Props {
  unreadMessageTypes: string[]
  readMessages: () => void
}

export const UserMessageBell = ({
  unreadMessageTypes,
  readMessages
}: Props) => {
  const router = useRouter()
  const { user } = useUserStore()

  const hasUnreadMessages = unreadMessageTypes.some(
    (type) => !user.mutedMessageTypes?.includes(type)
  )

  const handleClickButton = () => {
    if (hasUnreadMessages) {
      readMessages()
      router.push('/message/notice')
    }
  }

  return (
    <Tooltip
      disableAnimation
      showArrow
      closeDelay={0}
      content={hasUnreadMessages ? '您有新消息!' : '我的消息'}
    >
      <Button
        isIconOnly
        variant="light"
        onPress={handleClickButton}
        className="relative"
        aria-label="我的消息"
        as={Link}
        href="/message/notice"
      >
        <motion.div
          initial="initial"
          animate={hasUnreadMessages ? 'animate' : 'initial'}
          whileHover="hover"
          variants={bellShakeVariants}
        >
          {hasUnreadMessages ? (
            <BellRing className="size-6 text-primary" />
          ) : (
            <Bell className="size-6 text-default-500" />
          )}
        </motion.div>

        <AnimatePresence>
          {hasUnreadMessages && (
            <motion.div
              className="absolute rounded-full bottom-1 right-1 size-2 bg-danger"
              variants={dotVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            />
          )}
        </AnimatePresence>
      </Button>
    </Tooltip>
  )
}
