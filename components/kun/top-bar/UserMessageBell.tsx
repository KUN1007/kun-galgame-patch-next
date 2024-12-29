'use client'

import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Bell, BellRing } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next-nprogress-bar'
import { bellShakeVariants, dotVariants } from '~/motion/bell'

interface AnimatedNotificationBellProps {
  hasUnreadMessages: boolean
  setReadMessage: () => void
}

export const UserMessageBell = ({
  hasUnreadMessages,
  setReadMessage
}: AnimatedNotificationBellProps) => {
  const router = useRouter()

  const handleClickButton = () => {
    router.push('/message/notice')
    if (hasUnreadMessages) {
      setReadMessage()
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
