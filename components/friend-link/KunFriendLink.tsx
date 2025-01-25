'use client'

import { Card, CardBody, CardFooter, Image, Link } from '@nextui-org/react'
import { motion } from 'framer-motion'
import { kunMoyuMoe } from '~/config/moyu-moe'
import { kunFriends } from '~/config/friend'

export const KunFriendLink = () => {
  return (
    <div className="container mx-auto my-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="mb-4 text-4xl text-center text-primary-500">友情链接</h1>
        <p className="mb-12 text-center text-default-500">
          下方是我们的友站, 您可以点击以访问这些网站
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-2 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
        {kunFriends.map((friend, index) => (
          <motion.div
            key={friend.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="w-full h-full"
          >
            <Card
              isPressable
              isHoverable
              onPress={() => window.open(friend.link, '_blank')}
              className="w-full h-full border border-default-200"
            >
              <CardBody className="p-0 overflow-visible">
                <div className="flex justify-center w-full pt-4">
                  <Image
                    alt={friend.name}
                    className="object-cover w-24 h-24 rounded-lg"
                    src={friend.avatar}
                  />
                </div>
              </CardBody>
              <CardFooter className="flex flex-col items-center pt-4 pb-6">
                <h4 className="font-bold text-large">{friend.name}</h4>
                <p className="mt-1 text-sm text-center text-default-500 line-clamp-4">
                  {friend.label}
                </p>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mt-16">
          <h2 className="mb-4 text-2xl text-center text-default-800">
            加入我们
          </h2>
          <p className="mb-12 text-center text-default-500">
            要加入我们, 请加入我们的{' '}
            <Link
              isExternal
              showAnchorIcon
              href={kunMoyuMoe.domain.telegram_group}
              rel="noopener noreferrer"
            >
              Telegram 群组
            </Link>
            联系我们
          </p>
        </div>
      </motion.div>
    </div>
  )
}
