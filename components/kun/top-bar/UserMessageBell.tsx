'use client'

import { Button } from '@nextui-org/button'
import { Tooltip } from '@nextui-org/tooltip'
import { Bell, BellRing } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next-nprogress-bar'
import { dotVariants, bellShakeVariants } from '~/motion/bell'

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
    <Tooltip content={hasUnreadMessages ? '您有新消息!' : '我的消息'}>
      <Button
        isIconOnly
        variant="light"
        onClick={handleClickButton}
        className="relative"
      >
        <motion.div
          initial="initial"
          animate={hasUnreadMessages ? 'animate' : 'initial'}
          whileHover="hover"
          variants={bellShakeVariants}
        >
          {hasUnreadMessages ? (
            <BellRing className="w-6 h-6 text-primary" />
          ) : (
            <Bell className="w-6 h-6 text-default-500" />
          )}
        </motion.div>

        <AnimatePresence>
          {hasUnreadMessages && (
            <motion.div
              className="absolute w-2 h-2 rounded-full bottom-1 right-1 bg-danger"
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
