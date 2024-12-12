export const sanitizeFileName = (fileName: string) => {
  const match = fileName.match(/^(.*?)(\.[^.]+)?$/)
  if (!match) {
    return fileName
  }

  const baseName = match[1]
  const extension = match[2] || ''

  const sanitizedBaseName = baseName.replace(/[^\p{L}\p{N}_-]/gu, '')

  return `${sanitizedBaseName.slice(0, 100)}${extension}`
}
