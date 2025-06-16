'use client'

import { Tooltip } from '@heroui/tooltip'
import { Button, Link } from '@heroui/react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useHotkeys } from 'react-hotkeys-hook'

export const KunSearch = () => {
  const router = useRouter()
  useHotkeys('ctrl+k, cmd+k', (event) => {
    event.preventDefault()
    router.push('/search')
  })

  return (
    <Tooltip
      disableAnimation
      showArrow
      closeDelay={0}
      content="您可以按下 Ctrl + K 快速搜索"
    >
      <Button
        isIconOnly
        variant="light"
        aria-label="搜索"
        as={Link}
        href="/search"
      >
        <Search className="size-6 text-default-500" />
      </Button>
    </Tooltip>
  )
}
