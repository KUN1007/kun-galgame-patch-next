import { prisma } from './dbClient.js'
import {
  ensureDir,
  sleep,
  downloadImage,
  splitSummary,
  fs,
  path
} from './utils.js'
import { vndbPost, vndbFindVnByName, vndbGetReleasesByVn } from './api/vndb.js'
import {
  bgmPost,
  bgmGetSubject,
  bgmGetSubjectCharacters,
  bgmGetSubjectPersons,
  bgmGetCharacter,
  bgmGetPerson,
  pickBestBangumiSubject
} from './api/bangumi.js'
import { upsertCompanyByName, upsertTagByName } from './db.js'

export async function resolveVndbId(patch) {
  let vndbId = patch.vndb_id || null
  if (!vndbId) {
    try {
      const vn = await vndbFindVnByName(patch.name)
      if (vn?.id) vndbId = vn.id
      await sleep(500)
    } catch {}
  }
  try {
    await prisma.patch.update({
      where: { id: patch.id },
      data: { vndb_id: vndbId }
    })
  } catch {}
  return vndbId
}

export async function fetchVndbDetailAndSyncNames(vndbId, patchId) {
  if (!vndbId) return null
  try {
    let res = await vndbPost('/vn', {
      filters: ['id', '=', vndbId],
      fields:
        'id, title, titles{lang,title,latin,official,main}, description, aliases, released, languages, platforms, image{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, screenshots{id,url,dims,sexual,violence,votecount,thumbnail,thumbnail_dims}, tags{id,name,description,category,applicable,searchable,spoiler,lie,rating}, developers{id,name,original,aliases,description,type,lang,extlinks{id,label,name,url}}, staff{id,name,gender,lang,original,role,note}, va{character{id,name,original,image{id,url,dims,sexual,violence,votecount}}, staff{id,name,lang,original}}'
    })
    const vnDetail = res.results?.[0] || null
    if (vnDetail) {
      try {
        const nameEn = vnDetail.title || ''
        let nameJa = ''
        if (Array.isArray(vnDetail.titles)) {
          const mainJa = vnDetail.titles.find(
            (t) => t.lang === 'ja' && (t.main || t.official)
          )
          nameJa =
            mainJa?.title ||
            vnDetail.titles.find((t) => t.lang === 'ja')?.title ||
            ''
        }
        await prisma.patch.update({
          where: { id: patchId },
          data: { name_en_us: nameEn, name_ja_jp: nameJa }
        })
      } catch {}
    }
    await sleep(500)
    return vnDetail
  } catch (e) {
    console.warn(`VNDB vn fetch failed for ${vndbId}:`, e?.message || e)
    return null
  }
}

export async function syncVndbTags(vnDetail, ownerId, patchId, tagMap) {
  if (!Array.isArray(vnDetail?.tags) || !vnDetail.tags.length) return
  for (const t of vnDetail.tags) {
    const en = t.name || ''
    const zh = tagMap && en && tagMap[en] ? tagMap[en] : en
    const tid = await upsertTagByName(zh, '', ownerId, 'vndb', en)
    if (!tid) continue
    try {
      await prisma.patch_tag.update({
        where: { id: tid },
        data: { introduction_en_us: t.description || '' }
      })
    } catch {}
    try {
      await prisma.patch_tag_relation.create({
        data: { patch_id: patchId, tag_id: tid }
      })
    } catch {}
  }
}

export async function syncVndbDescription(vnDetail, patchId) {
  if (!vnDetail?.description) return
  try {
    await prisma.patch.update({
      where: { id: patchId },
      data: { introduction_en_us: vnDetail.description }
    })
  } catch {}
}

export async function syncVndbCover(vnDetail, baseDir, patchId) {
  if (!vnDetail?.image?.url) return
  const c = vnDetail.image
  try {
    const { buf, ext } = await downloadImage(c.url)
    const outDir = path.join(baseDir, 'cover')
    await ensureDir(outDir)
    await fs.writeFile(path.join(outDir, `banner.${ext}`), buf)
  } catch (e) {
    console.warn('cover download/process failed:', e?.message || e)
  }
  try {
    await prisma.patch_cover.upsert({
      where: { patch_id: patchId },
      update: {
        image_id: c.id || null,
        url: c.url || null,
        width: Array.isArray(c.dims) ? c.dims[0] : null,
        height: Array.isArray(c.dims) ? c.dims[1] : null,
        sexual: c.sexual ?? null,
        violence: c.violence ?? null,
        votecount: c.votecount ?? null,
        thumbnail_url: c.thumbnail || null,
        thumb_width: Array.isArray(c.thumbnail_dims)
          ? c.thumbnail_dims[0]
          : null,
        thumb_height: Array.isArray(c.thumbnail_dims)
          ? c.thumbnail_dims[1]
          : null
      },
      create: {
        patch_id: patchId,
        image_id: c.id || null,
        url: c.url || null,
        width: Array.isArray(c.dims) ? c.dims[0] : null,
        height: Array.isArray(c.dims) ? c.dims[1] : null,
        sexual: c.sexual ?? null,
        violence: c.violence ?? null,
        votecount: c.votecount ?? null,
        thumbnail_url: c.thumbnail || null,
        thumb_width: Array.isArray(c.thumbnail_dims)
          ? c.thumbnail_dims[0]
          : null,
        thumb_height: Array.isArray(c.thumbnail_dims)
          ? c.thumbnail_dims[1]
          : null
      }
    })
  } catch (e) {
    console.warn('cover upsert failed:', e?.message || e)
  }
}

export async function syncVndbScreenshots(vnDetail, baseDir, patchId) {
  if (!Array.isArray(vnDetail?.screenshots) || !vnDetail.screenshots.length)
    return
  for (let i = 0; i < vnDetail.screenshots.length; i++) {
    const s = vnDetail.screenshots[i]
    try {
      const { buf, ext } = await downloadImage(s.url)
      const outDir = path.join(baseDir, 'screenshots', `${i + 1}`)
      await ensureDir(outDir)
      await fs.writeFile(path.join(outDir, `shot.${ext}`), buf)
    } catch (e) {
      console.warn('screenshot download/process failed:', e?.message || e)
    }
    try {
      await prisma.patch_screenshot.create({
        data: {
          patch_id: patchId,
          image_id: s.id || null,
          url: s.url,
          width: Array.isArray(s.dims) ? s.dims[0] : null,
          height: Array.isArray(s.dims) ? s.dims[1] : null,
          sexual: s.sexual ?? null,
          violence: s.violence ?? null,
          votecount: s.votecount ?? null,
          thumbnail_url: s.thumbnail || null,
          thumb_width: Array.isArray(s.thumbnail_dims)
            ? s.thumbnail_dims[0]
            : null,
          thumb_height: Array.isArray(s.thumbnail_dims)
            ? s.thumbnail_dims[1]
            : null,
          order_no: i + 1
        }
      })
    } catch (e) {
      console.warn('screenshot create failed:', e?.message || e)
    }
    await sleep(200)
  }
}

export async function syncVndbReleasesAndCompanies(
  vndbId,
  vnDetail,
  ownerId,
  patchId
) {
  if (!vndbId) return
  try {
    const releases = await vndbGetReleasesByVn(vndbId)
    const companyIds = new Set()
    for (const r of releases) {
      try {
        if (Array.isArray(r.producers)) {
          for (const p of r.producers) {
            const compId = await upsertCompanyByName(
              p.name || p.original || '',
              p.lang || null,
              p.aliases || [],
              (p.extlinks || []).map((el) => el.url).filter(Boolean),
              ownerId,
              p.description || ''
            )
            if (compId) companyIds.add(compId)
          }
        }
        await prisma.patch_release.create({
          data: {
            patch_id: patchId,
            rid: r.id || null,
            title: r.title ?? '',
            released: r.released || null,
            platforms: Array.isArray(r.platforms) ? r.platforms : [],
            languages: Array.isArray(r.languages)
              ? r.languages.map((x) => x.lang || x).filter(Boolean)
              : [],
            minage: r.minage ?? null
          }
        })
      } catch (e) {
        console.warn('release create failed:', e?.message || e)
      }
    }
    if (Array.isArray(vnDetail?.developers)) {
      for (const d of vnDetail.developers) {
        const compId = await upsertCompanyByName(
          d.name || d.original || '',
          d.lang || null,
          d.aliases || [],
          (d.extlinks || []).map((el) => el.url).filter(Boolean),
          ownerId,
          d.description || ''
        )
        if (compId) companyIds.add(compId)
      }
    }
    for (const compId of companyIds) {
      try {
        await prisma.patch_company_relation.create({
          data: { patch_id: patchId, company_id: compId }
        })
      } catch {}
    }
    await sleep(300)
  } catch (e) {
    console.warn('VNDB releases fetch failed:', e?.message || e)
  }
}

export function initCharMapFromVndb(vnDetail) {
  const charMap = new Map()
  function putChar(key, data) {
    if (!key) return
    if (!charMap.has(key)) charMap.set(key, data)
  }
  if (vnDetail?.va) {
    for (const va of vnDetail.va) {
      const ch = va.character
      if (ch) {
        const k = `vndb-char:${ch.id}`
        putChar(k, {
          source: 'vndb',
          kind: 'character',
          vndb_char_id: ch.id,
          name: ch.name || ch.original || '',
          images: ch.image,
          roles: ['voice']
        })
      }
      const staff = va.staff
      if (staff) {
        const k = `vndb-staff:${staff.id}`
        putChar(k, {
          source: 'vndb',
          kind: 'person',
          vndb_staff_id: staff.id,
          name: staff.name || staff.original || '',
          images: null,
          roles: ['voice']
        })
      }
    }
  }
  if (vnDetail?.staff) {
    for (const s of vnDetail.staff) {
      const st = s
      const k = `vndb-staff:${st.id}`
      const roles = st.role ? [String(st.role).toLowerCase()] : []
      if (!charMap.has(k))
        charMap.set(k, {
          source: 'vndb',
          kind: 'person',
          vndb_staff_id: st.id,
          name: st.name || st.original || '',
          images: null,
          roles
        })
    }
  }
  return charMap
}

export async function findBangumiSubjectId(patchName, vnDetail, bid) {
  let subjectId = null
  let jaTitle = null
  try {
    if (vnDetail?.titles?.length) {
      const mainJa = vnDetail.titles.find(
        (t) => t.lang === 'ja' && (t.main || t.official)
      )
      jaTitle =
        mainJa?.title ||
        vnDetail.titles.find((t) => t.lang === 'ja')?.title ||
        null
    }
    if (jaTitle) {
      try {
        const searchJa = await bgmPost('/v0/search/subjects', {
          keyword: jaTitle,
          sort: 'match'
        })
        const listJa = searchJa?.data || searchJa?.list || []
        const bestJa = pickBestBangumiSubject(
          { query: patchName, jaTitle },
          listJa
        )
        if (bestJa?.id) subjectId = bestJa.id
      } catch {}
    }
    if (!subjectId) {
      try {
        const searchNm = await bgmPost('/v0/search/subjects', {
          keyword: patchName,
          sort: 'match'
        })
        const listNm = searchNm?.data || searchNm?.list || []
        const bestNm = pickBestBangumiSubject(
          { query: patchName, jaTitle },
          listNm
        )
        if (bestNm?.id) subjectId = bestNm.id
      } catch {}
    }
    if (!subjectId && bid) subjectId = bid
  } catch {}
  return subjectId
}

export async function handleBangumiSubjectAndTags(
  subjectId,
  vnDetail,
  baseDir,
  patchId,
  ownerId
) {
  if (!subjectId) return null
  try {
    const subject = await bgmGetSubject(subjectId)
    try {
      await prisma.patch.update({
        where: { id: patchId },
        data: { bid: subjectId }
      })
    } catch {}
    if (!vnDetail?.image?.url && subject?.images?.large) {
      try {
        const { buf, ext } = await downloadImage(subject.images.large)
        const outDir = path.join(baseDir, 'cover')
        await ensureDir(outDir)
        await fs.writeFile(path.join(outDir, `banner.${ext}`), buf)
        await prisma.patch_cover.upsert({
          where: { patch_id: patchId },
          update: { image_id: null, url: subject.images.large },
          create: {
            patch_id: patchId,
            image_id: null,
            url: subject.images.large
          }
        })
      } catch (e) {
        console.warn('bangumi cover fallback failed:', e?.message || e)
      }
    }
    const rawSummary = subject?.summary || ''
    const { chinese: zhFromSummary, japanese: jaFromSummary } =
      splitSummary(rawSummary)
    const zhName = subject?.name_cn || ''
    const jaName = subject?.nameJa || ''
    try {
      await prisma.patch.update({
        where: { id: patchId },
        data: {
          introduction_zh_cn: zhFromSummary,
          introduction_ja_jp: jaFromSummary,
          name_zh_cn: zhName,
          name_ja_jp: jaName
        }
      })
    } catch {}
    if (Array.isArray(subject?.tags) && subject.tags.length) {
      for (const tg of subject.tags) {
        const tname = tg?.name || ''
        const tid = await upsertTagByName(tname, '', ownerId, 'bangumi', '')
        if (!tid) continue
        try {
          await prisma.patch_tag_relation.create({
            data: { patch_id: patchId, tag_id: tid }
          })
        } catch {}
      }
    }
    if (!zhName && Array.isArray(vnDetail?.titles)) {
      const zhHans =
        vnDetail.titles.find((t) => t.lang === 'zh-Hans')?.title || ''
      const zhHant =
        vnDetail.titles.find((t) => t.lang === 'zh-Hant')?.title || ''
      const zhFallback = zhHans || zhHant
      if (zhFallback) {
        try {
          await prisma.patch.update({
            where: { id: patchId },
            data: { name_zh_cn: zhFallback }
          })
        } catch {}
      }
    }
    await sleep(200)
    return subject
  } catch (e) {
    console.warn('Bangumi subject fetch failed:', e?.message || e)
    return null
  }
}

export async function addBangumiCharactersToCharMap(subjectId, charMap) {
  if (!subjectId) return
  try {
    const chars = await bgmGetSubjectCharacters(subjectId)
    for (const c of chars || []) {
      const k = `bgm-char:${c.id}`
      const entry = {
        source: 'bangumi',
        kind: 'character',
        bangumi_character_id: c.id,
        name: c.name || c.name_cn || '',
        images: c.images || null,
        roles: []
      }
      if (c.summary) {
        const { chinese, japanese } = splitSummary(c.summary)
        Object.assign(entry, { zhSummary: chinese, jaSummary: japanese })
      }
      if (!charMap.has(k)) charMap.set(k, entry)
      try {
        const cdetail = await bgmGetCharacter(c.id)
        const { chinese, japanese } = splitSummary(cdetail?.summary || '')
        const prev = charMap.get(k) || entry
        charMap.set(k, {
          ...prev,
          zhSummary: chinese || prev.zhSummary,
          jaSummary: japanese || prev.jaSummary
        })
      } catch {}
    }
    await sleep(200)
  } catch (e) {
    console.warn('Bangumi characters fetch failed:', e?.message || e)
  }
}

export async function addBangumiPersonsAndCompanies(
  subjectId,
  baseDir,
  patchId,
  charMap
) {
  if (!subjectId) return
  try {
    const persons = await bgmGetSubjectPersons(subjectId)
    const companyIds = new Set()
    for (const p of persons || []) {
      if (p.type === 2 || p.type === 3) {
        try {
          const compId = await upsertCompanyByName(p.name || '', null, [], [])
          if (compId) companyIds.add(compId)
          if (p.summary) {
            const { chinese, japanese } = splitSummary(p.summary)
            try {
              await prisma.patch_company.update({
                where: { id: compId },
                data: {
                  introduction_zh_cn: chinese,
                  introduction_ja_jp: japanese
                }
              })
            } catch {}
          }
          try {
            const logoUrl =
              p.images?.large || p.images?.medium || p.images?.small || ''
            if (logoUrl) {
              const { buf, ext } = await downloadImage(logoUrl)
              const compDir = path.join(baseDir, 'companies', String(compId))
              await ensureDir(compDir)
              const fileName = `logo.${ext}`
              await fs.writeFile(path.join(compDir, fileName), buf)
              const relLogoPath = [
                'migration',
                'temp',
                `patch-${patchId}`,
                'companies',
                String(compId),
                fileName
              ].join('/')
              try {
                await prisma.patch_company.update({
                  where: { id: compId },
                  data: { logo: relLogoPath }
                })
              } catch {}
            }
          } catch {}
          try {
            const detail = await bgmGetPerson(p.id)
            const { chinese, japanese } = splitSummary(detail?.summary || '')
            await prisma.patch_company.update({
              where: { id: compId },
              data: {
                introduction_zh_cn: chinese,
                introduction_ja_jp: japanese
              }
            })
            try {
              const dlogo =
                detail?.images?.large ||
                detail?.images?.medium ||
                detail?.images?.small ||
                ''
              if (dlogo) {
                const { buf, ext } = await downloadImage(dlogo)
                const compDir = path.join(baseDir, 'companies', String(compId))
                await ensureDir(compDir)
                const fileName = `logo.${ext}`
                await fs.writeFile(path.join(compDir, fileName), buf)
                const relLogoPath = [
                  'migration',
                  'temp',
                  `patch-${patchId}`,
                  'companies',
                  String(compId),
                  fileName
                ].join('/')
                try {
                  await prisma.patch_company.update({
                    where: { id: compId },
                    data: { logo: relLogoPath }
                  })
                } catch {}
              }
            } catch {}
          } catch {}
        } catch {}
      } else {
        const k = `bgm-person:${p.id}`
        const base = {
          source: 'bangumi',
          kind: 'person',
          bangumi_person_id: p.id,
          name: p.name || p.name_cn || '',
          images: p.images || null,
          roles: []
        }
        if (p.summary) {
          const { chinese, japanese } = splitSummary(p.summary)
          Object.assign(base, { zhSummary: chinese, jaSummary: japanese })
        }
        if (!charMap.has(k)) charMap.set(k, base)
        try {
          const detail = await bgmGetPerson(p.id)
          const { chinese, japanese } = splitSummary(detail?.summary || '')
          const prev = charMap.get(k) || base
          charMap.set(k, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary
          })
        } catch {}
      }
    }
    for (const compId of companyIds) {
      try {
        await prisma.patch_company_relation.create({
          data: { patch_id: patchId, company_id: compId }
        })
      } catch {}
    }
    await sleep(200)
  } catch (e) {
    console.warn('Bangumi persons fetch failed:', e?.message || e)
  }
}

export async function persistCharMap(charMap, baseDir, patchId) {
  for (const [key, val] of charMap) {
    const data = {
      patch_id: patchId,
      source: val.source,
      kind: val.kind,
      vndb_char_id: val.vndb_char_id || null,
      vndb_staff_id: val.vndb_staff_id || null,
      bangumi_person_id: val.bangumi_person_id || null,
      bangumi_character_id: val.bangumi_character_id || null,
      name: val.name || '',
      name_zh_cn: '',
      name_ja_jp: '',
      name_en_us: '',
      alias: [],
      gender: null,
      blood_type: null,
      birth_year: null,
      birth_mon: null,
      birth_day: null,
      image: null,
      image_small: null,
      image_medium: null,
      image_large: null,
      image_grid: null,
      description: null,
      description_zh_cn: null,
      description_ja_jp: val.jaSummary || null,
      description_en_us: null,
      roles: Array.isArray(val.roles) ? val.roles : []
    }
    let imgUrl = null
    if (val.images?.url) imgUrl = val.images.url
    else if (val.images?.large) imgUrl = val.images.large
    else if (val.images?.medium) imgUrl = val.images.medium
    else if (val.images?.small) imgUrl = val.images.small
    if (imgUrl) {
      try {
        const { buf, ext } = await downloadImage(imgUrl)
        const outDir = path.join(
          baseDir,
          'chars',
          `${val.vndb_char_id || val.vndb_staff_id || val.bangumi_character_id || val.bangumi_person_id || 'unknown'}`
        )
        await ensureDir(outDir)
        await fs.writeFile(path.join(outDir, `portrait.${ext}`), buf)
        data.image = imgUrl
      } catch (e) {
        console.warn('char image process failed:', e?.message || e)
      }
    }
    try {
      await prisma.patch_char.create({ data })
    } catch (e) {
      console.warn('patch_char create failed:', e?.message || e)
    }
    await sleep(120)
  }
}
