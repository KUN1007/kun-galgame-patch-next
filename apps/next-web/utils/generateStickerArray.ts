export const generateStickerArray = () => {
  const result = []
  for (let set = 1; set <= 6; set++) {
    for (let id = 1; id <= 80; id++) {
      result.push(`https://sticker.kungal.com/stickers/KUNgal${set}/${id}.webp`)
    }
  }
  return result.slice(0, -6)
}
