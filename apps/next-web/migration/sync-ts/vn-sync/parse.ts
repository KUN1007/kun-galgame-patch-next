import path from 'path'

export interface ParsedPatchFileName {
  company: string
  startDate: string
  gameName: string
  vndbId: string // with leading 'v'
  platformRaw: string
  platform: 'windows' | 'other'
  groupName: string
  publishDate: string
  langRaw: 'CHS' | 'CHT'
  language: 'zh-Hans' | 'zh-Hant'
  fileName: string
  filePath: string
}

const PLATFORM_WINDOWS_KEYWORDS = ['windows', 'win', 'win32', 'win64']

export function normalizeLanguage(lang: string): 'zh-Hans' | 'zh-Hant' {
  const s = String(lang).toUpperCase()
  return s === 'CHT' ? 'zh-Hant' : 'zh-Hans'
}

export function normalizePlatform(p: string): 'windows' | 'other' {
  const s = String(p).toLowerCase()
  return PLATFORM_WINDOWS_KEYWORDS.some((k) => s.includes(k))
    ? 'windows'
    : 'other'
}

/**
 * Parse standardized patch filename like:
 * [Company][YYYYMMDD]Game Name[v31700][Windows][Group Name][YYYYMMDD][CHS].rar
 */
export function parsePatchFileName(
  filePath: string
): ParsedPatchFileName | null {
  const fileName = path.basename(filePath)
  const withoutExt = fileName.replace(/\.[^.]+$/, '')

  // Extract all bracketed segments and the middle title
  // Pattern: [A][B]TITLE[v####][P][G][D][L]
  const bracketMatches = [...withoutExt.matchAll(/\[([^\]]+)\]/g)].map(
    (m) => m[1]
  )

  // After removing all bracket segments, the remainder between the 2nd and 3rd brackets is the title
  // We can more robustly split by positions of bracket patterns
  const parts: { text: string; start: number; end: number }[] = []
  const rx = /\[[^\]]+\]/g
  let m: RegExpExecArray | null
  while ((m = rx.exec(withoutExt)) !== null) {
    parts.push({ text: m[0], start: m.index, end: m.index + m[0].length })
  }
  if (parts.length < 6) return null

  const second = parts[1]
  const third = parts[2]
  const title = withoutExt.slice(second.end, third.start)
  const rawTitle = title.trim()

  const [
    company,
    startDate,
    vPart,
    platformRaw,
    groupName,
    publishDate,
    langRaw
  ] = [
    bracketMatches[0],
    bracketMatches[1],
    bracketMatches[2],
    bracketMatches[3],
    bracketMatches[4],
    bracketMatches[5],
    bracketMatches[6]
  ]

  const vMatch = vPart?.match(/v(\d{1,6})/i)
  if (!vMatch) return null
  const vndbId = `v${vMatch[1]}`

  const language = normalizeLanguage(langRaw)
  const platform = normalizePlatform(platformRaw)

  return {
    company: company?.trim() || '',
    startDate: startDate?.trim() || '',
    gameName: rawTitle,
    vndbId,
    platformRaw: platformRaw?.trim() || '',
    platform,
    groupName: (groupName || '').trim(),
    publishDate: publishDate?.trim() || '',
    langRaw: (langRaw as any) || 'CHS',
    language,
    fileName,
    filePath
  }
}
