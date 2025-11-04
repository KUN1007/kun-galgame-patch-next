import { BGM_API, getBangumiAccessToken } from '../config.js'

/**
 * Perform a Bangumi GET request.
 * - Automatically appends nsfw=true to querystring for subject endpoints.
 * - Adds Authorization header when KUN_BANGUMI_TOKEN is present.
 */

export async function bgmGet(pathname, params = {}) {
  const q = new URLSearchParams({ nsfw: 'true', ...(params || {}) })
  const url = `${BGM_API}${pathname}${q.toString() ? `?${q.toString()}` : ''}`
  const token = getBangumiAccessToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error(`Bangumi ${pathname} HTTP ${res.status}`)
  return res.json()
}

/**
 * Perform a Bangumi POST request.
 * - For /v0/search/* endpoints, forces filter.nsfw = true to include adult tags.
 */
export async function bgmPost(pathname, json) {
  const url = `${BGM_API}${pathname}`
  const token = getBangumiAccessToken()
  const body = { ...(json || {}) }
  if (pathname.startsWith('/v0/search/')) {
    body.filter = { ...(body.filter || {}), nsfw: true }
  }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Bangumi ${pathname} HTTP ${res.status}`)
  return res.json()
}

/**
 * Find a subject by name via search API (best-effort: take first result).
 */
export async function bgmFindSubjectByName(name) {
  const data = await bgmPost('/v0/search/subjects', {
    keyword: name,
    sort: 'match'
  })
  return data?.data?.[0] || data?.list?.[0] || null
}

/**
 * Normalize titles for fuzzy scoring (lowercase, remove punctuation/whitespace).
 */
export function normalizeTitle(str) {
  if (!str) return ''
  return str
    .normalize('NFKC')
    .toLowerCase()
    .replace(
      /[\s_·・‐‑–—~'"`!@#$%^&*()\[\]{}|\\;:,.<>/?，。！￥（）：；【】《》、]/g,
      ''
    )
}

/**
 * Score Bangumi candidates against query and JP title; higher is better.
 */
export function scoreBangumiCandidate({ query, jaTitle }, c) {
  const name = c?.name || ''
  const nameCn = c?.name_cn || ''
  const nQuery = normalizeTitle(query)
  const nJa = normalizeTitle(jaTitle || '')
  const nName = normalizeTitle(name)
  const nNameCn = normalizeTitle(nameCn)
  let s = 0
  if (nJa && nName === nJa) s += 120
  if (nJa && nNameCn === nJa) s += 120
  if (nName === nQuery) s += 100
  if (nNameCn === nQuery) s += 100
  if (nJa && (nName.includes(nJa) || nJa.includes(nName))) s += 70
  if (nJa && (nNameCn.includes(nJa) || nJa.includes(nNameCn))) s += 70
  if (nName.includes(nQuery) || nQuery.includes(nName)) s += 60
  if (nNameCn.includes(nQuery) || nQuery.includes(nNameCn)) s += 60
  if (nJa && nName.startsWith(nJa)) s += 20
  if (nJa && nNameCn.startsWith(nJa)) s += 20
  if (nName.startsWith(nQuery) || nNameCn.startsWith(nQuery)) s += 10
  if (c?.type === 4) s += 20
  return s
}

/**
 * Pick the best-scored subject from a list.
 */
export function pickBestBangumiSubject({ query, jaTitle }, list) {
  if (!Array.isArray(list) || !list.length) return null
  let best = null
  let bestScore = -Infinity
  for (const c of list) {
    const sc = scoreBangumiCandidate({ query, jaTitle }, c)
    if (sc > bestScore) {
      best = c
      bestScore = sc
    }
  }
  return best
}

/** Get subject detail by id. */
export async function bgmGetSubject(id) {
  return bgmGet(`/v0/subjects/${id}`)
}

/** Get characters of a subject. */
export async function bgmGetSubjectCharacters(id) {
  return bgmGet(`/v0/subjects/${id}/characters`)
}

/** Get persons of a subject. */
export async function bgmGetSubjectPersons(id) {
  return bgmGet(`/v0/subjects/${id}/persons`)
}

/** Get character detail. */
export async function bgmGetCharacter(id) {
  return bgmGet(`/v0/characters/${id}`)
}

/** Get person detail. */
export async function bgmGetPerson(id) {
  return bgmGet(`/v0/persons/${id}`)
}

/*
可优化的地方：
- 针对 429 和 5xx 状态实现自动重试，配合 sleep 做退避；
- 将 Token 缺失时的行为（公开/私有资源访问）做更清晰提示；
- 为 normalizeTitle/scoreBangumiCandidate 增加单元测试覆盖。
*/
/*
可优化的地方：
- 针对 429/5xx 增加重试与退避；
- 将 normalizeTitle/score 作为可配置策略，便于以后用更高级的匹配；
- bgmGet/bgmPost 可统一封装日志与错误码解析，输出更有指引性的错误。
*/
