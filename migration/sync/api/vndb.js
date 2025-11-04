import { VNDB_API } from '../config.js'
/**
 * POST helper for VNDB Kana API.
 * Wraps fetch + JSON parse + HTTP status handling.
 */

export async function vndbPost(pathname, body) {
  const url = `${VNDB_API}${pathname}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`VNDB ${pathname} HTTP ${res.status}`)
  return res.json()
}

/**
 * Search VN by title string; returns first match (or null).
 * Fields kept minimal to identify VN and surface basic media fields.
 */
export async function vndbFindVnByName(name) {
  const data = await vndbPost('/vn', {
    filters: ['search', '=', name],
    fields:
      'id, title, titles{lang,title,latin,official,main}, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}'
  })
  return data.results?.[0] || null
}

/**
 * Get VN detail by id; includes staff/va lists for downstream linking.
 */
export async function vndbGetVnById(vndbId) {
  const data = await vndbPost('/vn', {
    filters: ['id', '=', vndbId],
    fields:
      'id, title, titles{lang,title,latin,official,main}, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, staff{id,name,gender,lang,original,role,note}, va{character{id,name,original,image{id,url,dims,sexual,violence,votecount}}, staff{id,name,lang,original}}'
  })
  return data.results?.[0] || null
}

/**
 * Get releases of a VN, plus producers (companies).
 */
export async function vndbGetReleasesByVn(vndbId) {
  const data = await vndbPost('/release', {
    filters: ['vn', '=', ['id', '=', vndbId]],
    fields:
      'id, title, released, platforms, languages{lang,latin,main,mtl,title}, minage, producers{developer,publisher,id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}'
  })
  return data.results || []
}

/**
 * Batch fetch staff by ids using OR filters as per Kana docs.
 * Note: caller controls ids length; we set results to ids.length to limit page size.
 */
export async function vndbGetStaffByIds(ids = []) {
  if (!Array.isArray(ids) || !ids.length) return []
  const MAX = 100
  const chunks = []
  for (let i = 0; i < ids.length; i += MAX) chunks.push(ids.slice(i, i + MAX))
  const out = []
  for (const part of chunks) {
    const idFilter =
      part.length === 1
        ? ['id', '=', part[0]]
        : ['or', ...part.map((id) => ['id', '=', id])]
    const filters = ['and', ['ismain', '=', 1], idFilter]
    const data = await vndbPost('/staff', {
      filters,
      // Only request fields allowed by /staff
      fields:
        'id, name, original, lang, gender, description, extlinks{url,label,name,id}, aliases{aid,name,latin,ismain}',
      results: Math.min(part.length, MAX)
    })
    if (Array.isArray(data.results)) out.push(...data.results)
  }
  return out
}

/**
 * Batch fetch characters by ids using OR filters.
 * Fields include gender/body metrics/aliases and VN-role mapping.
 */
export async function vndbGetCharactersByIds(ids = []) {
  if (!Array.isArray(ids) || !ids.length) return []
  const MAX = 100
  const chunks = []
  for (let i = 0; i < ids.length; i += MAX) chunks.push(ids.slice(i, i + MAX))
  const out = []
  for (const part of chunks) {
    const filters =
      part.length === 1
        ? ['id', '=', part[0]]
        : ['or', ...part.map((id) => ['id', '=', id])]
    const fields =
      'id, name, original, description, gender, height, weight, bust, waist, hips, cup, age, aliases, vns{id, role}'
    const data = await vndbPost('/character', {
      filters,
      fields,
      results: Math.min(part.length, MAX)
    })
    if (Array.isArray(data.results)) out.push(...data.results)
  }
  return out
}

/*
可优化的地方：
- 对超大 ids 列表按批分段请求，减少 OR 长度与响应体积；
- 根据 /schema 动态裁剪字段，避免接口字段变更导致 400；
- vndbPost 增加退避重试和速率限制，结合 sleep 统一调度。
*/
