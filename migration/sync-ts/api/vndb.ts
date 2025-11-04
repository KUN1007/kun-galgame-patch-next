/* VNDB Kana API (typed helpers) */
import { VNDB_API } from '../config'
import { sleep } from '../utils/sleep'

// Generic POST
async function vndbPost<T>(path: string, body: any): Promise<T> {
  const url = `${VNDB_API}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`VNDB ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

// Basic types (partial)
export type VndbId = string
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
  latin?: string
  official?: boolean
  main?: boolean
}

export interface VndbStaffListItem {
  id: string
  name: string
  original?: string | null
  role?: string
  lang?: string
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

export interface VndbVnDetail {
  id: string
  title: string
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
}

export async function vndbFindVnByName(
  name: string
): Promise<VndbVnDetail | null> {
  const data = await vndbPost<{ results?: VndbVnDetail[] }>('/vn', {
    filters: ['search', '=', name],
    fields:
      'id, title, titles{lang,title,latin,official,main}, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}'
  })
  return data.results?.[0] || null
}

export async function vndbGetVnById(id: string): Promise<VndbVnDetail | null> {
  const data = await vndbPost<{ results?: VndbVnDetail[] }>('/vn', {
    filters: ['id', '=', id],
    fields:
      'id, title, titles{lang,title,latin,official,main}, description, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, tags{id,name,description,category,applicable,searchable,spoiler,lie,rating}, developers{id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}, staff{id,name,gender,lang,original,role,note}, va{character{id,name,original,image{id,url,dims,sexual,violence,votecount}}, staff{id,name,lang,original}}'
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
}

export async function vndbGetReleasesByVn(
  vnId: string
): Promise<VndbRelease[]> {
  const data = await vndbPost<{ results?: VndbRelease[] }>('/release', {
    filters: ['vn', '=', ['id', '=', vnId]],
    fields:
      'id, title, released, platforms, languages{lang,latin,main,mtl,title}, minage, producers{developer,publisher,id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}'
  })
  return data.results || []
}

export interface VndbStaffAlias {
  aid: number
  name: string
  latin?: string | null
  ismain?: boolean
}
export interface VndbStaffDetail {
  id: string
  name: string
  original?: string | null
  lang?: string
  gender?: string | null
  description?: string | null
  extlinks?: Array<{ url: string; label: string; name: string; id: string }>
  aliases?: VndbStaffAlias[]
}

export async function vndbGetStaffByIds(
  ids: string[]
): Promise<VndbStaffDetail[]> {
  if (!Array.isArray(ids) || !ids.length) return []
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
  const out: VndbStaffDetail[] = []
  for (const part of chunks) {
    const idFilter =
      part.length === 1
        ? ['id', '=', part[0]]
        : ['or', ...part.map((id) => ['id', '=', id])]
    const filters = ['and', ['ismain', '=', 1], idFilter]
    const data = await vndbPost<{ results?: VndbStaffDetail[] }>('/staff', {
      filters,
      fields:
        'id, name, original, lang, gender, description, extlinks{url,label,name,id}, aliases{aid,name,latin,ismain}',
      results: Math.min(part.length, 100)
    })
    out.push(...(data.results || []))
    await sleep(150)
  }
  return out
}

export interface VndbCharacterDetail {
  id: string
  name: string
  original?: string | null
  description?: string | null
  gender?: string | string[] | null
  height?: number | null
  weight?: number | null
  bust?: number | null
  waist?: number | null
  hips?: number | null
  cup?: string | null
  age?: number | null
  aliases?: string[]
  birthday?: [number, number] | null
  vns?: Array<{ id: string; role: string }>
}

export async function vndbGetCharactersByIds(
  ids: string[]
): Promise<VndbCharacterDetail[]> {
  if (!Array.isArray(ids) || !ids.length) return []
  const chunks: string[][] = []
  for (let i = 0; i < ids.length; i += 100) chunks.push(ids.slice(i, i + 100))
  const out: VndbCharacterDetail[] = []
  for (const part of chunks) {
    const filters =
      part.length === 1
        ? ['id', '=', part[0]]
        : ['or', ...part.map((id) => ['id', '=', id])]
    const data = await vndbPost<{ results?: VndbCharacterDetail[] }>(
      '/character',
      {
        filters,
        fields:
          'id, name, original, description, gender, height, weight, bust, waist, hips, cup, age, aliases, vns{id, role}',
        results: Math.min(part.length, 100)
      }
    )
    out.push(...(data.results || []))
    await sleep(150)
  }
  return out
}

export { vndbPost }
