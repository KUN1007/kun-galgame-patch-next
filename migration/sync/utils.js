import fs from 'fs/promises'
import path from 'path'

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

export function extFromContentType(ct) {
  if (!ct) return 'bin'
  if (ct.includes('jpeg')) return 'jpg'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  if (ct.includes('avif')) return 'avif'
  return 'bin'
}

export async function downloadImage(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || ''
  const ext = extFromContentType(ct)
  return { buf, ext }
}

// Split combined CN/JP summary into separate fields
export function splitSummary(summary) {
  if (!summary) return { chinese: '', japanese: '' }

  let cleaned = summary
    .replace(/'\s*\+\s*'/g, '')
    .replace(/["'`]/g, '')
    .replace(/[【\[]/g, '「')
    .replace(/[】\]]/g, '」')
    .replace(/\r\n/g, '\n')
    .replace(/\s*\n\s*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()

  const japaneseRegex = /[\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/
  const match = cleaned.match(japaneseRegex)

  if (!match) {
    return { chinese: cleaned.trim(), japanese: '' }
  }

  const index = match.index ?? 0

  const splitPos = cleaned.lastIndexOf('\n', index)
  const cutIndex = splitPos >= 0 ? splitPos : index

  let chinesePart = cleaned.slice(0, cutIndex).trim()
  let japanesePart = cleaned.slice(cutIndex).trim()

  const chineseCharCount = (chinesePart.match(/[\u4E00-\u9FFF]/g) || []).length

  if (chineseCharCount < 5) {
    return { chinese: '', japanese: cleaned.trim() }
  }
  chinesePart = chinesePart.replace(/\n{2,}/g, '\n').trim()
  japanesePart = japanesePart.replace(/\n{2,}/g, '\n').trim()

  return { chinese: chinesePart, japanese: japanesePart }
}

export { fs, path }
