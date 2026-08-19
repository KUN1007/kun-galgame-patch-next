export const formatFileSize = (size: number) => {
  const MB = 1024 * 1024

  if (size < 1024) {
    return `${size} B`
  }
  if (size < MB) {
    return `${(size / 1024).toFixed(1)} KB`
  }
  if (size < 1024 * MB) {
    return `${(size / MB).toFixed(1)} MB`
  }
  return `${(size / (1024 * MB)).toFixed(2)} GB`
}

export const formatNumber = (num: number) => {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'M'
  } else if (num >= 10_000) {
    return (num / 10_000).toFixed(1) + 'w'
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k'
  } else {
    return num.toString()
  }
}
