import { VNDB_API } from '~/migration/sync-ts/config'

type VndbId = string

export interface VndbImage {
  id: string
  url: string
  dims?: [number, number]
  sexual?: number
  violence?: number
  votecount?: number
  thumbnail?: string
  thumbnail_dims?: [number, number]
}

export interface VndbTitle {
  lang: string
  title: string
  latin?: string | null
  official?: boolean
  main?: boolean
}

export interface VndbVaItem {
  character?: {
    id: string
    name?: string
    original?: string
    image?: VndbImage | null
  }
  staff?: { id: string; name?: string; lang?: string; original?: string }
}

export interface VndbStaffListItem {
  id: string
  name: string
  original?: string | null
  role?: string
  lang?: string
}

export interface VndbVnDetail {
  id: VndbId
  title: string
  alttitle?: string | null
  olang?: string | null
  titles?: VndbTitle[]
  description?: string
  image?: VndbImage
  screenshots?: VndbImage[]
  tags?: Array<{
    id: string
    name: string
    description?: string
    category: string
    spoiler?: number
  }>
  developers?: Array<{
    id: string
    name: string
    original?: string
    description?: string
    lang?: string
    aliases?: string[]
    extlinks?: Array<{ id: string; label: string; name: string; url: string }>
  }>
  staff?: VndbStaffListItem[]
  va?: VndbVaItem[]
  extlinks?: Array<{ url: string; label: string; name: string; id: string }>
}

const vndbPost = async <T>(path: string, body: any): Promise<T> => {
  const url = `${VNDB_API}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`VNDB ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

const normalizeVnIdForFilter = (id: string | number): string | number => {
  if (typeof id === 'number') return id
  const s = String(id || '').trim()
  const m = s.match(/^(?:[vV])?(\d+)$/)
  if (m) return Number(m[1])
  return s.toLowerCase()
}

export const vndbGetVnById = async (
  id: string
): Promise<VndbVnDetail | null> => {
  const norm = normalizeVnIdForFilter(id)
  const data = await vndbPost<{ results?: VndbVnDetail[] }>('/vn', {
    filters: ['id', '=', norm],
    fields:
      'id, title, alttitle, olang, titles{lang,title,latin,official,main}, description, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, tags{id,name,description,category,applicable,searchable,spoiler,lie,rating}, developers{id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}, staff{id,name,gender,lang,original,role,note}, va{character{id,name,original,image{id,url,dims,sexual,violence,votecount}}, staff{id,name,lang,original}}, extlinks{url,label,name,id}'
  })
  return data.results?.[0] || null
}

export interface VndbRelease {
  id: string | number
  title?: string
  released?: string
  platforms?: string[]
  languages?: Array<{ lang: string } | string>
  minage?: number
  producers?: Array<{
    developer?: boolean
    publisher?: boolean
    id: string
    name: string
    original?: string
    aliases?: string[]
    description?: string
    type?: string
    lang?: string
    extlinks?: Array<{ id: string; label: string; name: string; url: string }>
  }>
  images?: Array<
    VndbImage & {
      type?: string
      languages?: string[] | null
      photo?: boolean
      vn?: string | null
    }
  >
}

export const vndbGetReleasesByVn = async (
  vnId: string
): Promise<VndbRelease[]> => {
  const norm = normalizeVnIdForFilter(vnId)
  const data = await vndbPost<{ results?: VndbRelease[] }>('/release', {
    filters: ['vn', '=', ['id', '=', norm]],
    fields:
      'id, title, released, platforms, languages{lang,latin,main,mtl,title}, minage, images{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims,type,languages,photo,vn}, producers{developer,publisher,id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}'
  })
  return data.results || []
}
