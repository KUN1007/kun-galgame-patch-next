'use client'

import { Button } from '@nextui-org/button'
import { Pencil, CheckCircle2 } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'

interface Props {
  role: number
}

export const SelfButton = ({ role }: Props) => {
  const router = useRouter()

  return (
    <div className="flex-col w-full space-y-3">
      <Button
        startContent={<Pencil className="w-4 h-4" />}
        color="primary"
        variant="flat"
        fullWidth
        onClick={() => router.push('/settings/user')}
      >
        编辑信息
      </Button>

      {role < 2 && (
        <Button
          startContent={<CheckCircle2 className="w-4 h-4" />}
          color="primary"
          fullWidth
          onClick={() => router.push('/apply')}
        >
          申请成为创作者
        </Button>
      )}
    </div>
  )
}
