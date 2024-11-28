'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Toast } from 'react-hot-toast'
import { Button } from '@nextui-org/button'
import { toastVariants, iconVariants, textVariants } from '~/motion/sooner'
import loliImage from './utils/loli'
import Image from 'next/image'
import { Chip } from '@nextui-org/react'

interface ToastProps {
  message: string
  t: Toast
}

const { loli, name } = loliImage

const KunSooner = ({ message, t }: ToastProps) => {
  return (
    <motion.div
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex justify-center w-full "
    >
      <div className="flex w-full max-w-md p-2 shadow-lg pointer-events-auto bg-background rounded-2xl ring-1 ring-foreground/5">
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <motion.div
              variants={iconVariants}
              initial="initial"
              animate="animate"
              className="flex-shrink-0"
            >
              <Image
                src={loli}
                alt={name}
                width={50}
                height={50}
                className="w-16"
              />
            </motion.div>

            <motion.div
              variants={textVariants}
              initial="initial"
              animate="animate"
              className="relative flex-1 h-full ml-3 space-y-2"
            >
              <Chip
                color="primary"
                variant="shadow"
                className="absolute -top-10 -left-12"
                size="lg"
              >
                {name}
              </Chip>
              <p className="flex items-center font-medium">{message}</p>
            </motion.div>
          </div>
        </div>
        <div className="flex">
          <Button
            isIconOnly
            variant="light"
            className="flex items-center justify-center"
            onClick={() => toast.remove(t.id)}
          >
            <motion.div
              whileHover={{ rotate: 90 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-5 h-5" />
            </motion.div>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export const showKunSooner = (message: string) => {
  toast.custom((t) => <KunSooner message={message} t={t} />, {
    position: 'bottom-center',
    duration: 5000
  })
}
