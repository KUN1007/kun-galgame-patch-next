'use client'

import { Button, Tooltip } from '@nextui-org/react'
import { Share2 } from 'lucide-react'
import { kunCopy } from '~/utils/kunCopy'
import { kunMoyuMoe } from '~/config/moyu-moe'
import type { Patch } from '~/types/api/patch'

interface Props {
  patch: Patch
}

export const ShareButton = ({ patch }: Props) => {
  const handleCopyShareLink = () => {
    const text = `${patch.name} - ${kunMoyuMoe.domain.main}/patch/${patch.id}/introduction`
    kunCopy(text)
  }

  return (
    <Tooltip content="复制分享链接">
      <Button
        variant="bordered"
        aria-label="复制分享链接"
        isIconOnly
        onPress={handleCopyShareLink}
      >
        <Share2 className="size-4" />
      </Button>
    </Tooltip>
  )
}
