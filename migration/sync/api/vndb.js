import { VNDB_API } from '../config.js'

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

export async function vndbFindVnByName(name) {
  const data = await vndbPost('/vn', {
    filters: ['search', '=', name],
    fields:
      'id, title, titles{lang,title,latin,official,main}, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}'
  })
  return data.results?.[0] || null
}

export async function vndbGetVnById(vndbId) {
  const data = await vndbPost('/vn', {
    filters: ['id', '=', vndbId],
    fields:
      'id, title, titles{lang,title,latin,official,main}, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, staff{id,name,gender,lang,original,role,note}, va{character{id,name,original,image{id,url,dims,sexual,violence,votecount}}, staff{id,name,lang,original}}'
  })
  return data.results?.[0] || null
}

export async function vndbGetReleasesByVn(vndbId) {
  const data = await vndbPost('/release', {
    filters: ['vn', '=', ['id', '=', vndbId]],
    fields:
      'id, title, released, platforms, languages{lang,latin,main,mtl,title}, minage, producers{developer,publisher,id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}'
  })
  return data.results || []
}
