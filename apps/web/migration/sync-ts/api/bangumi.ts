/* Bangumi Open API v0 (typed helpers) */
import { BGM_API, getBangumiAccessToken } from '../config'

async function bgmGet<T>(
  path: string,
  params: Record<string, string | number | boolean> = {}
): Promise<T> {
  const q = new URLSearchParams({ nsfw: 'true', ...(params as any) })
  const url = `${BGM_API}${path}${q.toString() ? `?${q.toString()}` : ''}`
  const token = getBangumiAccessToken()
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
  if (!res.ok) throw new Error(`Bangumi ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

async function bgmPost<T>(path: string, json: any): Promise<T> {
  const url = `${BGM_API}${path}`
  const token = getBangumiAccessToken()
  const body = { ...(json || {}) }
  if (path.startsWith('/v0/search/'))
    body.filter = { ...(body.filter || {}), nsfw: true }
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Bangumi ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

// Types (partial)
export interface BgmImageSet {
  small?: string
  grid?: string
  large?: string
  medium?: string
}
export interface BgmSubject {
  id: number
  name: string
  name_cn?: string
  images?: BgmImageSet
  summary?: string
  tags?: Array<{ name: string }>
}
export interface BgmCharacterListItem {
  id: number
  name: string
  name_cn?: string
  images?: BgmImageSet
  relation?: string
  relation_name?: string
  summary?: string
}
export interface BgmPersonListItem {
  id: number
  name: string
  type?: number // 2 => company
  images?: BgmImageSet
  summary?: string
}
export interface BgmCharacterDetail {
  id: number
  name: string
  name_cn?: string
  images?: BgmImageSet
  summary?: string
  gender?: string
  birth_year?: number
  birth_mon?: number
  birth_day?: number
  infobox?: Array<{ key: string; value: any }>
}
export interface BgmPersonDetail {
  id: number
  name: string
  name_cn?: string
  images?: BgmImageSet
  summary?: string
  birth_year?: number
  birth_mon?: number
  birth_day?: number
  blood_type?: string | number | null
  infobox?: Array<{ key: string; value: any }>
}

export async function bgmGetSubject(id: number): Promise<BgmSubject> {
  return bgmGet(`/v0/subjects/${id}`)
}
export async function bgmGetSubjectCharacters(
  id: number
): Promise<BgmCharacterListItem[]> {
  return bgmGet(`/v0/subjects/${id}/characters`)
}
export async function bgmGetSubjectPersons(
  id: number
): Promise<BgmPersonListItem[]> {
  return bgmGet(`/v0/subjects/${id}/persons`)
}
export async function bgmGetCharacter(id: number): Promise<BgmCharacterDetail> {
  return bgmGet(`/v0/characters/${id}`)
}
export async function bgmGetPerson(id: number): Promise<BgmPersonDetail> {
  return bgmGet(`/v0/persons/${id}`)
}

export { bgmGet, bgmPost }
