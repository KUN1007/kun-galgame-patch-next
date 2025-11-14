'use client'

import { useState } from 'react'
import { Card, CardHeader, CardBody, Chip, Image, Tooltip } from '@heroui/react'
import { Puzzle } from 'lucide-react'
import { formatDate } from '~/utils/time'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { cn } from '~/utils/cn'
import { getPreferredLanguageText } from '~/utils/getPreferredLanguageText'
import type { GalgameReleaseCard } from '~/types/api/release'

interface PatchCardProps {
  patch: GalgameReleaseCard
}

export const ReleaseCard = ({ patch }: PatchCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const galgameName = getPreferredLanguageText(patch.name)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02 }}
      className="w-full"
    >
      <Card
        isPressable
        as={Link}
        href={`/patch/${patch.patchId}/introduction`}
        className="w-full h-full border border-default-100 dark:border-default-200"
      >
        <CardHeader className="p-0">
          <div className="relative w-full mx-auto overflow-hidden text-center rounded-t-lg opacity-90">
            <div
              className={cn(
                'absolute inset-0 animate-pulse bg-default-100',
                imageLoaded ? 'opacity-0' : 'opacity-90',
                'transition-opacity duration-300'
              )}
              style={{ aspectRatio: '16/9' }}
            />
            <Image
              radius="none"
              alt={galgameName}
              className={cn(
                'size-full object-cover transition-all duration-300',
                imageLoaded ? 'scale-100 opacity-90' : 'scale-105 opacity-0'
              )}
              removeWrapper={true}
              src={
                patch.banner
                  ? patch.banner.replace(/\.avif$/, '-mini.avif')
                  : '/kungalgame.avif'
              }
              style={{ aspectRatio: '16/9' }}
              onLoad={() => setImageLoaded(true)}
            />
          </div>
        </CardHeader>
        <CardBody className="justify-between space-y-2">
          <h2 className="font-semibold transition-colors text-medium sm:text-lg line-clamp-2 hover:text-primary-500">
            {galgameName}
          </h2>

          <div className="flex items-center justify-between gap-2">
            <Chip size="sm" color="primary" variant="flat">
              发售于 {formatDate(patch.released)}
            </Chip>

            <Tooltip content="补丁下载资源数">
              <div className="flex items-center gap-1">
                <Puzzle className="text-default-500 size-4" />
                <span className="text-sm text-default-500">
                  {patch.resourceCount}
                </span>
              </div>
            </Tooltip>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  )
}
