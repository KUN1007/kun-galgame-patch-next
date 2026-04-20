const generateStickerArray = (): string[] => {
  const result: string[] = []
  for (let set = 1; set <= 6; set++) {
    for (let id = 1; id <= 80; id++) {
      result.push(`https://sticker.kungal.com/stickers/KUNgal${set}/${id}.webp`)
    }
  }
  return result.slice(0, -6)
}

const STICKERS = generateStickerArray()

const hashString = (input: string): number => {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export const getRandomSticker = (seed: string) => {
  const index = STICKERS.length ? hashString(seed) % STICKERS.length : 0
  return ref(STICKERS[index] ?? '')
}
