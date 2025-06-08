'use client'

import { Button } from '@heroui/react'
import { Dices } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { kunFetchGet } from '~/utils/kunFetch'
import type { ButtonProps } from '@heroui/react'

type KunButtonProps = Omit<ButtonProps, 'startContent' | 'onPress'>

export const RandomGalgameButton = (props: KunButtonProps) => {
  const router = useRouter()

  const fetchRandomId = async () => {
    const response =
      await kunFetchGet<KunResponse<{ id: string }>>('/home/random')

    if (typeof response === 'string') {
      toast.error(response)
      return
    }

    return response.id
  }

  const handleRandomJump = async () => {
    const patchId = await fetchRandomId()
    if (patchId) {
      router.push(`/patch/${patchId}/introduction`)
    }
  }

  return (
    <Button
      {...props}
      onPress={handleRandomJump}
      startContent={props.isIconOnly ? '' : <Dices size={18} />}
    >
      {props.isIconOnly ? (
        <Dices className="text-default-500 size-6" />
      ) : (
        '随机一部游戏'
      )}
    </Button>
  )
}
