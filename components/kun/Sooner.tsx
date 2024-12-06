'use client'

import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { toast } from 'react-hot-toast'
import type { Toast } from 'react-hot-toast'
import { Button } from '@nextui-org/button'
import { iconVariants, textVariants, toastVariants } from '~/motion/sooner'
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
      className="flex w-full justify-center "
    >
      <div className="pointer-events-auto flex w-full max-w-md rounded-2xl bg-background p-2 shadow-lg ring-1 ring-foreground/5">
        <div className="w-0 flex-1 p-4">
          <div className="flex items-start">
            <motion.div
              variants={iconVariants}
              initial="initial"
              animate="animate"
              className="shrink-0"
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
              className="relative ml-3 h-full flex-1 space-y-2"
            >
              <Chip
                color="primary"
                variant="shadow"
                className="absolute -left-12 -top-10"
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
              <X className="size-5" />
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
