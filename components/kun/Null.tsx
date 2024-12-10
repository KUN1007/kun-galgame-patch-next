import { randomNum } from '~/utils/random'
import { useEffect, useState } from 'react'
import { KunLoading } from './Loading'
import Image from 'next/image'

interface Props {
  message: string
}

export const KunNull = ({ message }: Props) => {
  const [stickerSrc, setStickerSrc] = useState('')

  useEffect(() => {
    const randomPackIndex = randomNum(1, 5)
    const randomStickerIndex = randomNum(1, 80)
    setStickerSrc(
      `https://sticker.kungal.com/stickers/KUNgal${randomPackIndex}/${randomStickerIndex}.webp`
    )
  }, [])

  if (!stickerSrc) {
    return <KunLoading hint="正在加载中..." />
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4 size-full">
      <Image
        className="rounded-2xl size-auto"
        src={stickerSrc}
        alt={message}
        width={150}
        height={150}
        priority
      />
      <span>{message}</span>
    </div>
  )
}
