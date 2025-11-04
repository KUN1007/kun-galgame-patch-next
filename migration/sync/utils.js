import fs from 'fs/promises'
import path from 'path'

/**
 * Pause execution for a period of time.
 * Purpose: throttle API requests and DB writes to respect rate limits.
 */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Ensure directory exists (idempotent).
 */
export async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

/**
 * Convert Content-Type to a file extension.
 */
export function extFromContentType(ct) {
  if (!ct) return 'bin'
  if (ct.includes('jpeg')) return 'jpg'
  if (ct.includes('png')) return 'png'
  if (ct.includes('webp')) return 'webp'
  if (ct.includes('gif')) return 'gif'
  if (ct.includes('avif')) return 'avif'
  return 'bin'
}

/**
 * Download an image and return Buffer + inferred extension.
 */
export async function downloadImage(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  const ct = res.headers.get('content-type') || ''
  const ext = extFromContentType(ct)
  return { buf, ext }
}

/**
 * Split combined CN/JP summary into separate fields.
 * Heuristic: find first JP token and split at nearest newline boundary.
 */
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

  const before = cleaned[cutIndex - 1]
  const after = cleaned[cutIndex]
  if (before !== '\n' && after !== '\n') {
    return { chinese: '', japanese: cleaned.trim() }
  }

  let chinesePart = cleaned.slice(0, cutIndex).trim()
  let japanesePart = cleaned.slice(cutIndex).trim()

  const firstChineseChars = (chinesePart.match(/[\u4E00-\u9FFF]/g) || [])
    .slice(0, 7)
    .join('')

  const traditionalOrJapaneseRegex =
    /[\u3400-\u4DBF\uF900-\uFAFF\u2E80-\u2EFF\u3040-\u30FF\u31F0-\u31FF\uFF66-\uFF9F]/

  if (traditionalOrJapaneseRegex.test(firstChineseChars)) {
    return { chinese: '', japanese: cleaned.trim() }
  }

  chinesePart = chinesePart.replace(/\n{2,}/g, '\n').trim()
  japanesePart = japanesePart.replace(/\n{2,}/g, '\n').trim()

  return { chinese: chinesePart, japanese: japanesePart }
}

export { fs, path }

/*
可优化的地方：
- downloadImage 可加入超时/重试（AbortController + 重试策略）。
- splitSummary 的启发式拆分可结合更多样本微调或参数化。
- ensureDir 可增加内存缓存，避免在同一 tick 内频繁 mkdir 调用。
*/
