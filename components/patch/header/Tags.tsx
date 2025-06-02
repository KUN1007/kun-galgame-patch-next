'use client'

import { Chip } from "@heroui/chip"
import { motion } from 'framer-motion'
import {
  SUPPORTED_LANGUAGE_MAP,
  SUPPORTED_PLATFORM_MAP,
  SUPPORTED_TYPE_MAP
} from '~/constants/resource'
import type { Patch } from '~/types/api/patch'

interface TagsProps {
  patch: Patch
}

export const Tags = ({ patch }: TagsProps) => {
  // Animation variants
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
      {patch.platform.length > 0 &&
        patch.platform.map((platform, index) => (
          <motion.div key={platform} variants={item}>
            <Chip
              variant="flat"
              className="transition-all hover:scale-105"
              size="sm"
            >
              {SUPPORTED_PLATFORM_MAP[platform]}
            </Chip>
          </motion.div>
        ))}

      {patch.language.length > 0 &&
        patch.language.map((language) => (
          <motion.div key={language} variants={item}>
            <Chip
              color="primary"
              variant="flat"
              className="transition-all hover:scale-105"
              size="sm"
            >
              {SUPPORTED_LANGUAGE_MAP[language]}
            </Chip>
          </motion.div>
        ))}

      {patch.type.length > 0 &&
        patch.type.map((type) => (
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
