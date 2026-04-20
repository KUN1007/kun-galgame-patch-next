'use client'

import { Chip } from '@heroui/chip'
import { motion } from 'framer-motion'
import {
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP,
  SUPPORTED_TYPE_MAP
} from '~/constants/resource'

interface TagsProps {
  platform: string[]
  language: string[]
  type: string[]
}

export const Tags = ({ platform, language, type }: TagsProps) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className="flex flex-wrap gap-2"
      variants={container}
      initial="hidden"
      animate="show"
    >
      {platform.length > 0 &&
        platform.map((platform, index) => (
          <motion.div key={platform} variants={item}>
            <Chip
              variant="flat"
              className="transition-all hover:scale-105"
              size="sm"
              color="success"
            >
              {SUPPORTED_PLATFORM_MAP[platform]}
            </Chip>
          </motion.div>
        ))}

      {language.length > 0 &&
        language.map((language) => (
          <motion.div key={language} variants={item}>
            <Chip
              color="secondary"
              variant="flat"
              className="transition-all hover:scale-105"
              size="sm"
            >
              {SUPPORTED_LANGUAGE_MAP[language]}
            </Chip>
          </motion.div>
        ))}

      {type.length > 0 &&
        type.map((type) => (
          <motion.div key={type} variants={item}>
            <Chip
              color="primary"
              variant="solid"
              className="transition-all hover:scale-105"
              size="sm"
            >
              {SUPPORTED_TYPE_MAP[type]}
            </Chip>
          </motion.div>
        ))}
    </motion.div>
  )
}
