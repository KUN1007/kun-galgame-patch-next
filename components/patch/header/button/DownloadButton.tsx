'use client'

import { Button, Tooltip } from '@nextui-org/react'
import { Download } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import type { Patch } from '~/types/api/patch'

interface Props {
  patch: Patch
}

export const DownloadButton = ({ patch }: Props) => {
  const router = useRouter()

  return (
    <Tooltip content="下载游戏补丁">
      <Button
        color="primary"
        variant="shadow"
        isIconOnly
        aria-label="下载游戏补丁"
        onClick={() => router.push(`/patch/${patch.id}/resource`)}
      >
        <Download className="size-5" />
      </Button>
    </Tooltip>
  )
}
