'use client'

import { Button } from '@nextui-org/button'
import { Pencil } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

export const EditButton = () => {
  const router = useRouter()

  return (
    <Button
      startContent={<Pencil className="w-4 h-4" />}
      color="primary"
      variant="flat"
      fullWidth
      onClick={() => router.push('/settings/user')}
    >
      编辑信息
    </Button>
  )
}
