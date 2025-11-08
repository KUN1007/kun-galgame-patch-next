import { BGM_API } from '~/migration/sync-ts/config'

export interface BgmSubject {
  id: number
  name?: string
  name_cn?: string
  summary?: string
  images?: { large?: string; medium?: string; small?: string }
  infobox?: Array<{ key?: string; value?: any }>
  tags?: Array<{ name?: string }>
}

const bgmGet = async <T>(path: string): Promise<T> => {
  const url = `${BGM_API}${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BGM GET ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

const bgmPost = async <T>(path: string, body: any): Promise<T> => {
  const url = `${BGM_API}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`BGM POST ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

export const bgmGetSubject = async (id: number): Promise<BgmSubject | null> => {
  return await bgmGet<BgmSubject | null>(`/v0/subjects/${id}`)
}

export const bgmSearchSubjects = async (
  keyword: string
): Promise<BgmSubject[]> => {
  const data = await bgmPost<any>('/v0/search/subjects', {
    keyword,
    sort: 'match'
  })
  const list = data?.data || data?.list || []
  return Array.isArray(list) ? list : []
}
