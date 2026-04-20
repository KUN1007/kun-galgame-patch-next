export const shuffleArray = <T>(values: T[]) => {
  const items = [...values]
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j]!, items[i]!]
  }
  return items
}

export const uniqueArray = <T>(list: T[]) => Array.from(new Set(list))
