import { randomNum } from '~/utils/random'

const randomPackIndex = randomNum(1, 5)
const randomStickerIndex = randomNum(1, 80)
const stickerSrc = `https://sticker.kungal.com/stickers/KUNgal${randomPackIndex}/${randomStickerIndex}.webp`

interface Props {
  message: string
}

export const KunNull = ({ message }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full space-y-4">
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
