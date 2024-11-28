'use client'

import { Button } from '@nextui-org/button'
import { Pencil, CheckCircle2, Shield } from 'lucide-react'
import { useRouter } from 'next-nprogress-bar'
import type { UserInfo } from '~/types/api/user'

interface Props {
  user: UserInfo
}

export const SelfButton = ({ user }: Props) => {
  const router = useRouter()
  const isShowAdminButton = user.id === user.requestUserUid && user.role > 2

  return (
    <div className="flex-col w-full space-y-3">
      <div className="flex space-x-3">
        <Button
          startContent={<Pencil className="w-4 h-4" />}
          color="primary"
          variant="flat"
          fullWidth
          onClick={() => router.push('/settings/user')}
        >
          编辑信息
        </Button>

        {isShowAdminButton && (
          <Button
            startContent={<Shield className="w-4 h-4" />}
            color="primary"
            variant="solid"
            fullWidth
            onClick={() => router.push('/admin')}
          >
            管理面板
          </Button>
        )}
      </div>

      {user.role < 2 && (
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
