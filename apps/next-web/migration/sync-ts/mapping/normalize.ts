import path from 'node:path'
import fs from 'node:fs/promises'

export function normalizeJaName(
  name: string,
  options: { kana?: 'hiragana' } = {}
): string {
  if (!name) return ''
  let n = name
  n = n.replace(/<.*?>|\(.*?\)|\[.*?\]|\{.*?\}/g, '')
  n = n.replace(/[!-~]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  )
  n = n.replace(/[\s\t]+/g, '')
  n = n
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (options.kana === 'hiragana') {
    n = n.replace(/[\u30a1-\u30f6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
  }
  return n.trim()
}

export function splitSummary(text: string): {
  chinese: string
  japanese: string
} {
  if (!text) return { chinese: '', japanese: '' }
  // Heuristic split by CJK block ratio; simple but effective for our data.
  const isCJK = (s: string) =>
    /[\u3040-\u30ff\u3400-\u9fff\uff00-\uff9f]/.test(s)
  const lines = text.split(/\n+/)
  const zh: string[] = []
  const ja: string[] = []
  for (const ln of lines) {
    if (!ln.trim()) continue
    // Extremely rough: if contains kana, likely Japanese; otherwise treat as Chinese fallback
    if (/[\u3040-\u30ff]/.test(ln)) ja.push(ln)
    else zh.push(ln)
  }
  return { chinese: zh.join('\n'), japanese: ja.join('\n') }
}

export async function appendJsonLine(filePath: string, record: any) {
  const dir = path.dirname(filePath)
  await fs.mkdir(dir, { recursive: true })
  const line = JSON.stringify(record) + '\n'
  await fs.appendFile(filePath, line, 'utf8')
}
