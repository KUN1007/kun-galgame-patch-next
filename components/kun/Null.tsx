import { randomNum } from '~/utils/random'
import { useEffect, useState } from 'react'
import { KunLoading } from './Loading'

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
    <div className="flex size-full flex-col items-center justify-center space-y-4">
      <img
        className="rounded-2xl"
        src={stickerSrc}
        alt={message}
        width={150}
        height={150}
      />
      <span>{message}</span>
    </div>
  )
}
