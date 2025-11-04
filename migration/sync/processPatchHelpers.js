import { prisma } from './dbClient.js'
import { ensureDir, sleep, splitSummary, fs, path } from './utils.js'
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
import { vndbGetStaffByIds, vndbGetCharactersByIds } from './api/vndb.js'

// Override earlier placeholder with a robust version that tolerates key variants and encodings
function normalizeNamesForMatching(bgmName, bgmInfobox) {
  const names = new Set()
  if (bgmName) names.add(normalizeJaName(bgmName))
  try {
    const inf = Array.isArray(bgmInfobox) ? bgmInfobox : []
    const aliasEntry = inf.find((x) => {
      const k = String(x?.key || '').trim()
      return k === '别名' || k === '別名' || k.toLowerCase() === 'alias'
    })
    if (aliasEntry) {
      const val = aliasEntry.value
      if (Array.isArray(val)) {
        for (const item of val) {
          const v = typeof item === 'string' ? item : item?.v
          if (v) names.add(normalizeJaName(String(v)))
        }
      } else if (typeof val === 'string') {
        names.add(normalizeJaName(val))
      }
    }
  } catch {}
  return Array.from(names).filter(Boolean)
}

/**
 * Build a normalized name set for VNDB staff matching.
 * Sources: name, original, aliases{name, latin}
 */
function normalizeNamesFromVndbStaff(st) {
  const names = new Set()
  if (st?.name) names.add(normalizeJaName(st.name))
  if (st?.original) names.add(normalizeJaName(st.original))
  if (Array.isArray(st?.aliases)) {
    for (const a of st.aliases) {
      if (a?.name) names.add(normalizeJaName(a.name))
      if (a?.latin) names.add(normalizeJaName(a.latin))
    }
  }
  return Array.from(names).filter(Boolean)
}

/**
 * Append a person/character log record as a JSON line.
 * Purpose: aid debugging mapping of staff/person across providers.
 */
async function appendPersonLog(record) {
  try {
    const outDir = path.join('migration', 'sync', 'data')
    await ensureDir(outDir)
    const outFile = path.join(outDir, 'char.json')
    const line = JSON.stringify(record) + '\n'
    await fs.appendFile(outFile, line, { encoding: 'utf8' })
  } catch (e) {
    console.warn('appendPersonLog failed:', e?.message || e)
  }
}

function normalizeJaName(name, options = {}) {
  if (!name) return ''

  let n = name

  n = n.replace(/（.*?）|\(.*?\)|\[.*?\]|\【.*?\】/g, '')
  n = n.replace(/[！-～]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
  )
  n = n.replace(/[\s　\t]+/g, '')
  n = n.replace(/[・･＝=－—〜~‒–―]+/g, '')
  n = n.replace(/[“”‘’'"「」『』]/g, '')
  n = n
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
  if (options.kana === 'hiragana') {
    n = n.replace(/[\u30a1-\u30f6]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60)
    )
  }
  n = n.replace(/^[・･＝=－—〜~‒–―]+|[・･＝=－—〜~‒–―]+$/g, '')
  n = n.replace(/＝|・|･/g, '')

  return n.trim()
}

/**
 * Resolve a patch's VNDB id.
 * - Use existing patch.vndb_id if present; otherwise search by name.
 * - Persist the resolved id back to DB (best-effort, ignore errors).
 */
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

/**
 * Fetch VNDB VN detail and sync localized names into patch.
 * Key logic:
 * - Use titles list to find main/official Japanese title for name_ja_jp
 * - Use canonical title as name_en_us
 */
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

/**
 * Upsert VNDB tags to local patch_tag & patch_tag_relation.
 * - Map VNDB category shorthand to internal category (cont/ero/tech)
 * - Localize tag name via provided tagMap (EN->ZH) when possible
 * - Update patch_tag.description_en_us for EN descriptions
 * - Maintain tag.count += 1 to speed future aggregations
 */
export async function syncVndbTags(vnDetail, ownerId, patchId, tagMap) {
  if (!Array.isArray(vnDetail?.tags) || !vnDetail.tags.length) return
  for (const t of vnDetail.tags) {
    const en = t.name || ''
    const zh = tagMap && en && tagMap[en] ? tagMap[en] : en
    // Map VNDB category shorthand to internal category
    let category = 'content'
    if (t.category === 'cont') category = 'content'
    else if (t.category === 'ero') category = 'sexual'
    else if (t.category === 'tech') category = 'technical'
    const tid = await upsertTagByName(zh, '', ownerId, 'vndb', en, category)
    if (!tid) continue
    try {
      await prisma.patch_tag.update({
        where: { id: tid },
        data: { introduction_en_us: t.description || '' }
      })
    } catch {}
    try {
      await prisma.patch_tag_relation.create({
        data: {
          patch_id: patchId,
          tag_id: tid,
          spoiler_level: Number.isInteger(t.spoiler) ? t.spoiler : 0
        }
      })
      try {
        await prisma.patch_tag.update({
          where: { id: tid },
          data: { count: { increment: 1 } }
        })
      } catch {}
    } catch {}
  }
}

/** Sync VNDB description into patch.introduction_en_us if present. */
export async function syncVndbDescription(vnDetail, patchId) {
  if (!vnDetail?.description) return
  try {
    await prisma.patch.update({
      where: { id: patchId },
      data: { introduction_en_us: vnDetail.description }
    })
  } catch {}
}

/**
 * Sync VNDB cover into patch_cover via upsert on patch_id.
 * - Copy size/ratings/thumbnail metrics; default to 0/'' when missing.
 */
export async function syncVndbCover(vnDetail, baseDir, patchId) {
  if (!vnDetail?.image?.url) return
  const c = vnDetail.image
  try {
    await prisma.patch_cover.upsert({
      where: { patch_id: patchId },
      update: {
        image_id: c.id ? String(c.id) : '',
        url: c.url || '',
        width: Array.isArray(c.dims) ? c.dims[0] : 0,
        height: Array.isArray(c.dims) ? c.dims[1] : 0,
        sexual: typeof c.sexual === 'number' ? c.sexual : 0,
        violence: typeof c.violence === 'number' ? c.violence : 0,
        votecount: typeof c.votecount === 'number' ? c.votecount : 0,
        thumbnail_url: c.thumbnail || '',
        thumb_width: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[0] : 0,
        thumb_height: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[1] : 0
      },
      create: {
        patch_id: patchId,
        image_id: c.id ? String(c.id) : '',
        url: c.url || '',
        width: Array.isArray(c.dims) ? c.dims[0] : 0,
        height: Array.isArray(c.dims) ? c.dims[1] : 0,
        sexual: typeof c.sexual === 'number' ? c.sexual : 0,
        violence: typeof c.violence === 'number' ? c.violence : 0,
        votecount: typeof c.votecount === 'number' ? c.votecount : 0,
        thumbnail_url: c.thumbnail || '',
        thumb_width: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[0] : 0,
        thumb_height: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[1] : 0
      }
    })
  } catch (e) {
    console.warn('cover upsert failed:', e?.message || e)
  }
}

/**
 * Insert VNDB screenshots into patch_screenshot with order_no sequence.
 */
export async function syncVndbScreenshots(vnDetail, baseDir, patchId) {
  if (!Array.isArray(vnDetail?.screenshots) || !vnDetail.screenshots.length)
    return
  for (let i = 0; i < vnDetail.screenshots.length; i++) {
    const s = vnDetail.screenshots[i]
    try {
      await prisma.patch_screenshot.create({
        data: {
          patch_id: patchId,
          image_id: s.id ? String(s.id) : '',
          url: s.url || '',
          width: Array.isArray(s.dims) ? s.dims[0] : 0,
          height: Array.isArray(s.dims) ? s.dims[1] : 0,
          sexual: typeof s.sexual === 'number' ? s.sexual : 0,
          violence: typeof s.violence === 'number' ? s.violence : 0,
          votecount: typeof s.votecount === 'number' ? s.votecount : 0,
          thumbnail_url: s.thumbnail || '',
          thumb_width: Array.isArray(s.thumbnail_dims)
            ? s.thumbnail_dims[0]
            : 0,
          thumb_height: Array.isArray(s.thumbnail_dims)
            ? s.thumbnail_dims[1]
            : 0,
          order_no: i + 1
        }
      })
    } catch (e) {
      console.warn('screenshot create failed:', e?.message || e)
    }
    await sleep(200)
  }
}

/**
 * Fetch VNDB releases and related producers; upsert patch_release and
 * patch_company (+relation), plus increment patch_company.count.
 */
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
    for (let i = 0; i < releases.length; i++) {
      const r = releases[i]
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
        // Ensure rid is unique and non-empty
        let rid = r.id ? String(r.id) : ''
        if (!rid) rid = `v-${vndbId}-${i + 1}`
        await prisma.patch_release.upsert({
          where: { rid },
          update: {
            patch_id: patchId,
            title: r.title ?? '',
            released: r.released || '',
            platforms: Array.isArray(r.platforms) ? r.platforms : [],
            languages: Array.isArray(r.languages)
              ? r.languages.map((x) => x.lang || x).filter(Boolean)
              : [],
            minage: typeof r.minage === 'number' ? r.minage : 0
          },
          create: {
            patch_id: patchId,
            rid,
            title: r.title ?? '',
            released: r.released || '',
            platforms: Array.isArray(r.platforms) ? r.platforms : [],
            languages: Array.isArray(r.languages)
              ? r.languages.map((x) => x.lang || x).filter(Boolean)
              : [],
            minage: typeof r.minage === 'number' ? r.minage : 0
          }
        })
      } catch (e) {
        console.warn('release upsert failed:', e?.message || e)
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
        try {
          await prisma.patch_company.update({
            where: { id: compId },
            data: { count: { increment: 1 } }
          })
        } catch {}
      } catch {}
    }
    await sleep(300)
  } catch (e) {
    console.warn('VNDB releases fetch failed:', e?.message || e)
  }
}

/**
 * Build initial character/person map from VNDB staff and VA relations.
 * Map entries use composite keys: 'vndb-char:<id>' / 'vndb-staff:<id>'.
 */
export function initCharMapFromVndb(vnDetail) {
  const charMap = new Map()
  function putChar(key, data) {
    if (!key) return
    if (!charMap.has(key)) {
      charMap.set(key, data)
    } else {
      const prev = charMap.get(key)
      const mergedRoles = Array.from(
        new Set([...(prev?.roles || []), ...(data?.roles || [])])
      )
      charMap.set(key, { ...prev, roles: mergedRoles })
    }
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
          nameEn: ch.name || '',
          nameJa: ch.original || '',
          imagesVndb: ch.image,
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
          nameEn: staff.name || '',
          nameJa: staff.original || '',
          imagesVndb: null,
          roles: ['voice']
        })
        // Log VNDB staff entry from VA relation
        appendPersonLog({
          provider: 'vndb',
          kind: 'staff',
          id: staff.id,
          name: staff.name || staff.original || '',
          data: staff
        })
      }
    }
  }
  if (vnDetail?.staff) {
    for (const s of vnDetail.staff) {
      const st = s
      const k = `vndb-staff:${st.id}`
      const roles = st.role ? [String(st.role).toLowerCase()] : []
      if (!charMap.has(k)) {
        charMap.set(k, {
          source: 'vndb',
          kind: 'person',
          vndb_staff_id: st.id,
          name: st.name || st.original || '',
          nameEn: st.name || '',
          nameJa: st.original || '',
          imagesVndb: null,
          roles
        })
      } else {
        const prev = charMap.get(k)
        const mergedRoles = Array.from(
          new Set([...(prev?.roles || []), ...roles])
        )
        charMap.set(k, { ...prev, roles: mergedRoles })
      }
      // Log VNDB staff from staff list
      appendPersonLog({
        provider: 'vndb',
        kind: 'staff',
        id: st.id,
        name: st.name || st.original || '',
        data: st
      })
    }
  }
  return charMap
}

/**
 * Find matching Bangumi subject id by JP title first, then by patch name.
 * - score list and pick best match; fallback to provided bid.
 */
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

/**
 * Fetch Bangumi subject detail and sync:
 * - patch.bid
 * - patch_cover fallback when VNDB cover missing
 * - introduction/name localization
 * - Bangumi tags → patch_tag (+count) + relation
 */
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
        await prisma.patch_cover.upsert({
          where: { patch_id: patchId },
          update: { image_id: '', url: subject.images.large },
          create: {
            patch_id: patchId,
            image_id: '',
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
        // Bangumi tags are treated as sexual by default
        const tid = await upsertTagByName(
          tname,
          '',
          ownerId,
          'bangumi',
          '',
          'sexual'
        )
        if (!tid) continue
        try {
          await prisma.patch_tag_relation.create({
            data: { patch_id: patchId, tag_id: tid, spoiler_level: 0 }
          })
          try {
            await prisma.patch_tag.update({
              where: { id: tid },
              data: { count: { increment: 1 } }
            })
          } catch {}
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

/**
 * Merge Bangumi characters into charMap (source: 'bangumi').
 * - Attempt JP-name matching against VNDB characters
 * - Enrich with summaries & infobox (alias, BWH)
 * - Record tentative role (main/supporting) via relation hints
 */
export async function addBangumiCharactersToCharMap(subjectId, charMap) {
  if (!subjectId) return
  try {
    const chars = await bgmGetSubjectCharacters(subjectId)
    for (const c of chars || []) {
      const k = `bgm-char:${c.id}`
      const ja = c.name || ''
      const zh = c.name_cn || ''
      // 依据 Bangumi 关系推断主/配角
      const rel = String(c.relation || c.relation_name || '').toLowerCase()
      const roleSet = new Set()
      if (rel.includes('主') || rel.includes('main')) roleSet.add('main')
      else if (rel) roleSet.add('supporting')
      const entry = {
        source: 'bangumi',
        kind: 'character',
        bangumi_character_id: c.id,
        name: c.name || c.name_cn || '',
        nameJa: ja,
        nameZh: zh,
        imagesBgm: c.images || null,
        roles: Array.from(roleSet)
      }
      if (c.summary) {
        const { chinese, japanese } = splitSummary(c.summary)
        Object.assign(entry, { zhSummary: chinese, jaSummary: japanese })
      }

      // Try to match with existing VNDB character by Japanese name
      let targetKey = null
      for (const [ck, cv] of charMap.entries()) {
        if (cv && cv.kind === 'character') {
          const vJa = cv.nameJa || ''
          if (
            vJa &&
            normalizeJaName(vJa) &&
            normalizeJaName(vJa) === normalizeJaName(ja)
          ) {
            targetKey = ck
            break
          }
        }
      }

      if (targetKey) {
        const prev = charMap.get(targetKey) || {}
        charMap.set(targetKey, {
          ...prev,
          bangumi_character_id: c.id,
          nameJa: prev.nameJa || ja,
          nameZh: prev.nameZh || zh,
          imagesBgm: c.images || prev.imagesBgm || null,
          zhSummary: entry.zhSummary || prev.zhSummary,
          jaSummary: entry.jaSummary || prev.jaSummary
        })
      } else {
        if (!charMap.has(k)) charMap.set(k, entry)
      }
      try {
        const cdetail = await bgmGetCharacter(c.id)
        const { chinese, japanese } = splitSummary(cdetail?.summary || '')
        const g = String(cdetail?.gender || '')
        const by = Number(cdetail?.birth_year || 0)
        const bm = Number(cdetail?.birth_mon || 0)
        const bd = Number(cdetail?.birth_day || 0)
        let bdayStr = ''
        if (by) {
          bdayStr = String(by).padStart(4, '0')
          if (bm) bdayStr += '-' + String(bm).padStart(2, '0')
          if (bd) bdayStr += '-' + String(bd).padStart(2, '0')
        }
        const mappedGender =
          g.includes('male') || g.includes('男')
            ? 'male'
            : g.includes('female') || g.includes('女')
              ? 'female'
              : 'unknown'
        const infobox = cdetail?.infobox || null
        if (targetKey) {
          const prev = charMap.get(targetKey) || entry
          charMap.set(targetKey, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary,
            gender: mappedGender || prev.gender,
            birthday: prev.birthday || bdayStr,
            infobox: infobox || prev.infobox
          })
          // parse additional infobox fields for character
          try {
            const inf = infobox || []
            const zhName = inf.find((x) => x.key === '简体中文名')?.value || ''
            if (zhName) {
              const prevN =
                (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
              const objN = { ...prevN, nameZh: prevN.nameZh || String(zhName) }
              if (targetKey) charMap.set(targetKey, objN)
              else charMap.set(k, objN)
            }
            const aliasEntry = inf.find((x) => x.key === '别名')
            if (aliasEntry) {
              const vals = Array.isArray(aliasEntry.value)
                ? aliasEntry.value
                    .map((i) => (typeof i === 'string' ? i : i?.v))
                    .filter(Boolean)
                : aliasEntry.value
                  ? [aliasEntry.value]
                  : []
              if (vals.length) {
                const prevA =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const merged = Array.from(
                  new Set([...(prevA.char_aliases || []), ...vals])
                )
                const objA = { ...prevA, char_aliases: merged }
                if (targetKey) charMap.set(targetKey, objA)
                else charMap.set(k, objA)
              }
            }
            const bwhEntry = inf.find(
              (x) => x.key && x.key.toUpperCase() === 'BWH'
            )
            if (bwhEntry && typeof bwhEntry.value === 'string') {
              const m = bwhEntry.value.match(
                /B(\d+)\s*\/\s*W(\d+)\s*\/\s*H(\d+)/i
              )
              if (m) {
                const [_, B, W, H] = m
                const prevB =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const objB = {
                  ...prevB,
                  bust: Number(B) || 0,
                  waist: Number(W) || 0,
                  hips: Number(H) || 0
                }
                if (targetKey) charMap.set(targetKey, objB)
                else charMap.set(k, objB)
              }
            }
          } catch {}
          // parse additional infobox fields for character
          try {
            const inf = infobox || []
            const zhName = inf.find((x) => x.key === '简体中文名')?.value || ''
            if (zhName) {
              const prevN =
                (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
              const objN = { ...prevN, nameZh: prevN.nameZh || String(zhName) }
              if (targetKey) charMap.set(targetKey, objN)
              else charMap.set(k, objN)
            }
            const aliasEntry = inf.find((x) => x.key === '别名')
            if (aliasEntry) {
              const vals = Array.isArray(aliasEntry.value)
                ? aliasEntry.value
                    .map((i) => (typeof i === 'string' ? i : i?.v))
                    .filter(Boolean)
                : aliasEntry.value
                  ? [aliasEntry.value]
                  : []
              if (vals.length) {
                const prevA =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const merged = Array.from(
                  new Set([...(prevA.char_aliases || []), ...vals])
                )
                const objA = { ...prevA, char_aliases: merged }
                if (targetKey) charMap.set(targetKey, objA)
                else charMap.set(k, objA)
              }
            }
            const bwhEntry = inf.find(
              (x) => x.key && x.key.toUpperCase() === 'BWH'
            )
            if (bwhEntry && typeof bwhEntry.value === 'string') {
              const m = bwhEntry.value.match(
                /B(\d+)\s*\/\s*W(\d+)\s*\/\s*H(\d+)/i
              )
              if (m) {
                const [_, B, W, H] = m
                const prevB =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const objB = {
                  ...prevB,
                  bust: Number(B) || 0,
                  waist: Number(W) || 0,
                  hips: Number(H) || 0
                }
                if (targetKey) charMap.set(targetKey, objB)
                else charMap.set(k, objB)
              }
            }
          } catch {}
        } else {
          const prev = charMap.get(k) || entry
          charMap.set(k, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary,
            gender: mappedGender || prev.gender,
            birthday: prev.birthday || bdayStr,
            infobox: infobox || prev.infobox
          })
          // parse additional infobox fields for character
          try {
            const inf = infobox || []
            const zhName = inf.find((x) => x.key === '简体中文名')?.value || ''
            if (zhName) {
              const prevN =
                (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
              const objN = { ...prevN, nameZh: prevN.nameZh || String(zhName) }
              if (targetKey) charMap.set(targetKey, objN)
              else charMap.set(k, objN)
            }
            const aliasEntry = inf.find((x) => x.key === '别名')
            if (aliasEntry) {
              const vals = Array.isArray(aliasEntry.value)
                ? aliasEntry.value
                    .map((i) => (typeof i === 'string' ? i : i?.v))
                    .filter(Boolean)
                : aliasEntry.value
                  ? [aliasEntry.value]
                  : []
              if (vals.length) {
                const prevA =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const merged = Array.from(
                  new Set([...(prevA.char_aliases || []), ...vals])
                )
                const objA = { ...prevA, char_aliases: merged }
                if (targetKey) charMap.set(targetKey, objA)
                else charMap.set(k, objA)
              }
            }
            const bwhEntry = inf.find(
              (x) => x.key && x.key.toUpperCase() === 'BWH'
            )
            if (bwhEntry && typeof bwhEntry.value === 'string') {
              const m = bwhEntry.value.match(
                /B(\d+)\s*\/\s*W(\d+)\s*\/\s*H(\d+)/i
              )
              if (m) {
                const [_, B, W, H] = m
                const prevB =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const objB = {
                  ...prevB,
                  bust: Number(B) || 0,
                  waist: Number(W) || 0,
                  hips: Number(H) || 0
                }
                if (targetKey) charMap.set(targetKey, objB)
                else charMap.set(k, objB)
              }
            }
          } catch {}
          // parse additional infobox fields for character
          try {
            const inf = infobox || []
            const zhName = inf.find((x) => x.key === '简体中文名')?.value || ''
            if (zhName) {
              const prevN =
                (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
              const objN = { ...prevN, nameZh: prevN.nameZh || String(zhName) }
              if (targetKey) charMap.set(targetKey, objN)
              else charMap.set(k, objN)
            }
            const aliasEntry = inf.find((x) => x.key === '别名')
            if (aliasEntry) {
              const vals = Array.isArray(aliasEntry.value)
                ? aliasEntry.value
                    .map((i) => (typeof i === 'string' ? i : i?.v))
                    .filter(Boolean)
                : aliasEntry.value
                  ? [aliasEntry.value]
                  : []
              if (vals.length) {
                const prevA =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const merged = Array.from(
                  new Set([...(prevA.char_aliases || []), ...vals])
                )
                const objA = { ...prevA, char_aliases: merged }
                if (targetKey) charMap.set(targetKey, objA)
                else charMap.set(k, objA)
              }
            }
            const bwhEntry = inf.find(
              (x) => x.key && x.key.toUpperCase() === 'BWH'
            )
            if (bwhEntry && typeof bwhEntry.value === 'string') {
              const m = bwhEntry.value.match(
                /B(\d+)\s*\/\s*W(\d+)\s*\/\s*H(\d+)/i
              )
              if (m) {
                const [_, B, W, H] = m
                const prevB =
                  (targetKey ? charMap.get(targetKey) : charMap.get(k)) || entry
                const objB = {
                  ...prevB,
                  bust: Number(B) || 0,
                  waist: Number(W) || 0,
                  hips: Number(H) || 0
                }
                if (targetKey) charMap.set(targetKey, objB)
                else charMap.set(k, objB)
              }
            }
          } catch {}
        }
      } catch {}
    }
    await sleep(200)
  } catch (e) {
    console.warn('Bangumi characters fetch failed:', e?.message || e)
  }
}

/**
 * Merge Bangumi persons and companies:
 * - type===2 are companies; upsert + logo/introduction from detail
 * - others are persons; attempt robust alias-based matching to VNDB staff
 */
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
      if (p.type === 2) {
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
              try {
                await prisma.patch_company.update({
                  where: { id: compId },
                  data: { logo: logoUrl }
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
                try {
                  await prisma.patch_company.update({
                    where: { id: compId },
                    data: { logo: dlogo }
                  })
                } catch {}
              }
            } catch {}
          } catch {}
        } catch {}
      } else {
        const k = `bgm-person:${p.id}`
        const ja = p.name || ''
        const base = {
          source: 'bangumi',
          kind: 'person',
          bangumi_person_id: p.id,
          name: p.name || p.name_cn || '',
          nameJa: ja,
          imagesBgm: p.images || null,
          roles: []
        }
        if (p.summary) {
          const { chinese, japanese } = splitSummary(p.summary)
          Object.assign(base, { zhSummary: chinese, jaSummary: japanese })
        }

        // Match Bangumi person with VNDB staff via normalized aliases
        let targetKey = null
        let detail = null
        try {
          detail = await bgmGetPerson(p.id)
        } catch {}
        const bgmNorms = await normalizeNamesForMatching(
          p.name || p.name_cn || '',
          detail?.infobox || []
        )
        for (const [ck, cv] of charMap.entries()) {
          if (cv && cv.kind === 'person' && cv.source === 'vndb') {
            const vnSet = new Set(
              [
                normalizeJaName(cv.name || ''),
                normalizeJaName(cv.nameJa || ''),
                ...(Array.isArray(cv.aliases)
                  ? cv.aliases.map((x) => normalizeJaName(String(x)))
                  : [])
              ].filter(Boolean)
            )
            if (bgmNorms.some((n) => vnSet.has(n))) {
              targetKey = ck
              break
            }
          }
        }

        if (targetKey) {
          const prev = charMap.get(targetKey) || {}
          charMap.set(targetKey, {
            ...prev,
            bangumi_person_id: p.id,
            nameJa: prev.nameJa || ja,
            imagesBgm: p.images || prev.imagesBgm || null,
            zhSummary: base.zhSummary || prev.zhSummary,
            jaSummary: base.jaSummary || prev.jaSummary
          })
        } else {
          if (!charMap.has(k)) charMap.set(k, base)
        }

        // Log Bangumi person (list item)
        appendPersonLog({
          provider: 'bangumi',
          kind: 'person',
          id: p.id,
          name: p.name || p.name_cn || '',
          data: p
        })
        try {
          const detail = await bgmGetPerson(p.id)
          const { chinese, japanese } = splitSummary(detail?.summary || '')
          if (targetKey) {
            const prev = charMap.get(targetKey) || base
            charMap.set(targetKey, {
              ...prev,
              zhSummary: chinese || prev.zhSummary,
              jaSummary: japanese || prev.jaSummary
            })
          } else {
            const prev = charMap.get(k) || base
            charMap.set(k, {
              ...prev,
              zhSummary: chinese || prev.zhSummary,
              jaSummary: japanese || prev.jaSummary
            })
          }
          // enrich bangumi person fields from infobox & data (apply to whichever key is active)
          try {
            const activeKey = targetKey || k
            const inf = detail?.infobox || []
            const zhName = inf.find((x) => x.key === '简体中文名')?.value || ''
            if (zhName) {
              const prevN = charMap.get(activeKey) || base
              const objN = { ...prevN, nameZh: prevN.nameZh || String(zhName) }
              charMap.set(activeKey, objN)
            }
            const aliasEntry = inf.find((x) => x.key === '别名')
            if (aliasEntry) {
              const vals = Array.isArray(aliasEntry.value)
                ? aliasEntry.value
                    .map((i) => (typeof i === 'string' ? i : i?.v))
                    .filter(Boolean)
                : aliasEntry.value
                  ? [aliasEntry.value]
                  : []
              if (vals.length) {
                const prevA = charMap.get(activeKey) || base
                const merged = Array.from(
                  new Set([...(prevA.aliases || []), ...vals])
                )
                const objA = { ...prevA, aliases: merged }
                charMap.set(activeKey, objA)
              }
            }
            const by = Number(detail?.birth_year || 0)
            const bm = Number(detail?.birth_mon || 0)
            const bd = Number(detail?.birth_day || 0)
            let bday = ''
            if (by) {
              bday = String(by).padStart(4, '0')
              if (bm) bday += '-' + String(bm).padStart(2, '0')
              if (bd) bday += '-' + String(bd).padStart(2, '0')
            }
            const prevB = charMap.get(activeKey) || base
            const objB = {
              ...prevB,
              birthday: prevB.birthday || bday,
              blood_type: prevB.blood_type || String(detail?.blood_type || '')
            }
            charMap.set(activeKey, objB)
            const mapKeys = [
              ['引用来源', 'reference_source'],
              ['出生地', 'birthplace'],
              ['事务所', 'office'],
              ['Twitter', 'x'],
              ['配偶', 'spouse'],
              ['官方网站', 'official_website'],
              ['个人博客', 'blog']
            ]
            for (const [ik, fk] of mapKeys) {
              const v = inf.find((x) => x.key === ik)?.value
              if (v) {
                const prevC = charMap.get(activeKey) || objB
                const str = Array.isArray(v) ? v[0]?.v || v[0] || '' : v
                const objC = { ...prevC, [fk]: String(str) }
                charMap.set(activeKey, objC)
              }
            }
          } catch {}
          // Log Bangumi person detail
          appendPersonLog({
            provider: 'bangumi',
            kind: 'person',
            id: p.id,
            name: detail?.name || detail?.name_cn || p.name || p.name_cn || '',
            data: detail || {}
          })
        } catch {}
      }
    }
    for (const compId of companyIds) {
      try {
        await prisma.patch_company_relation.create({
          data: { patch_id: patchId, company_id: compId }
        })
        try {
          await prisma.patch_company.update({
            where: { id: compId },
            data: { count: { increment: 1 } }
          })
        } catch {}
      } catch {}
    }
    await sleep(200)
  } catch (e) {
    console.warn('Bangumi persons fetch failed:', e?.message || e)
  }
}

/**
 * Persist merged charMap to DB:
 * - patch_person: language/links/birthday/blood_type/... + aliases table
 * - patch_char: role/birthday/body metrics/... + aliases table
 * - Avoid nulls; use ''/0 for unknowns
 */
export async function persistCharMap(charMap, baseDir, patchId) {
  for (const [key, val] of charMap) {
    // Common fields shared by both models (excluding schema-specific ones)
    const common = {
      patch_id: patchId,
      name_zh_cn: val.nameZh || '',
      name_ja_jp: val.nameJa || '',
      name_en_us: val.nameEn || '',
      image: '',
      description_zh_cn: val.zhSummary || '',
      description_ja_jp: val.jaSummary || '',
      description_en_us: val.descriptionEn || '',
      roles: Array.isArray(val.roles) ? val.roles : []
    }

    let imgUrl = null
    if (val.imagesBgm?.large) imgUrl = val.imagesBgm.large
    else if (val.images?.large) imgUrl = val.images.large
    else if (val.imagesVndb?.url) imgUrl = val.imagesVndb.url
    if (imgUrl) {
      common.image = imgUrl
    }

    try {
      if (val.kind === 'person') {
        const personData = {
          ...common,
          language: val.language || '',
          links: Array.isArray(val.links) ? val.links.filter(Boolean) : [],
          birthday: val.birthday ? String(val.birthday) : '',
          blood_type: val.blood_type || '',
          reference_source: val.reference_source || '',
          birthplace: val.birthplace || '',
          office: val.office || '',
          x: val.x || '',
          spouse: val.spouse || '',
          official_website: val.official_website || '',
          blog: val.blog || ''
        }
        if (val.vndb_staff_id) personData.vndb_staff_id = val.vndb_staff_id
        if (val.bangumi_person_id)
          personData.bangumi_person_id = val.bangumi_person_id
        // patch_person schema no longer has gender; do not include it
        let personRec = null
        if (personData.vndb_staff_id) {
          personRec = await prisma.patch_person.upsert({
            where: {
              patch_id_vndb_staff_id: {
                patch_id: personData.patch_id,
                vndb_staff_id: personData.vndb_staff_id
              }
            },
            update: personData,
            create: personData
          })
        } else if (personData.bangumi_person_id) {
          personRec = await prisma.patch_person.upsert({
            where: {
              patch_id_bangumi_person_id: {
                patch_id: personData.patch_id,
                bangumi_person_id: personData.bangumi_person_id
              }
            },
            update: personData,
            create: personData
          })
        } else {
          personRec = await prisma.patch_person.create({ data: personData })
        }
        // write alias rows
        const personAliases = Array.isArray(val.aliases)
          ? Array.from(
              new Set(val.aliases.map((x) => String(x).trim()).filter(Boolean))
            )
          : []
        if (personRec && personAliases.length) {
          try {
            await prisma.patch_person_alias.createMany({
              data: personAliases.map((name) => ({
                name,
                person_id: personRec.id
              })),
              skipDuplicates: true
            })
          } catch {
            for (const name of personAliases) {
              try {
                await prisma.patch_person_alias.create({
                  data: { name, person_id: personRec.id }
                })
              } catch {}
            }
          }
        }
      } else {
        const charData = {
          ...common,
          // Store Bangumi infobox as JSON string in patch_char.infobox
          infobox: JSON.stringify(val.infobox || []),
          gender: val.gender || 'unknown',
          role: val.role || 'side',
          birthday: val.birthday ? String(val.birthday) : '',
          bust: Number(val.bust || 0),
          waist: Number(val.waist || 0),
          hips: Number(val.hips || 0),
          height: Number(val.height || 0),
          weight: Number(val.weight || 0),
          cup: val.cup || '',
          age: Number(val.age || 0)
        }
        if (val.vndb_char_id) charData.vndb_char_id = val.vndb_char_id
        if (val.bangumi_character_id)
          charData.bangumi_character_id = val.bangumi_character_id
        // 始终写入性别，无法判断时使用 unknown 避免默认 female        charData.gender = val.gender || 'unknown'
        if (charData.vndb_char_id) {
          let charRecTemp = await prisma.patch_char.upsert({
            where: {
              patch_id_vndb_char_id: {
                patch_id: charData.patch_id,
                vndb_char_id: charData.vndb_char_id
              }
            },
            update: charData,
            create: charData
          })
          var charRec = charRecTemp
        } else if (charData.bangumi_character_id) {
          let charRecTemp = await prisma.patch_char.upsert({
            where: {
              patch_id_bangumi_character_id: {
                patch_id: charData.patch_id,
                bangumi_character_id: charData.bangumi_character_id
              }
            },
            update: charData,
            create: charData
          })
          var charRec = charRecTemp
        } else {
          var charRec = await prisma.patch_char.create({ data: charData })
        }
        const charAliases = Array.isArray(val.char_aliases)
          ? Array.from(
              new Set(
                val.char_aliases.map((x) => String(x).trim()).filter(Boolean)
              )
            )
          : []
        if (charRec && charAliases.length) {
          try {
            await prisma.patch_char_alias.createMany({
              data: charAliases.map((name) => ({
                name,
                patch_char_id: charRec.id
              })),
              skipDuplicates: true
            })
          } catch {
            for (const name of charAliases) {
              try {
                await prisma.patch_char_alias.create({
                  data: { name, patch_char_id: charRec.id }
                })
              } catch {}
            }
          }
        }
      }
    } catch (e) {
      console.warn('patch_char/person upsert failed:', e?.message || e)
    }
    await sleep(120)
  }
}

/**
 * Enrich VNDB-derived entries (staff/characters) with detailed fields:
 * - staff: language, extlinks, aliases, EN description, birthday, blood_type
 * - character: gender/body metrics/aliases, VN-specific role mapping
 */
export async function augmentVndbDetails(vnDetail, vndbId, charMap) {
  try {
    const staffIds = []
    const charIds = []
    if (Array.isArray(vnDetail?.staff)) {
      for (const s of vnDetail.staff) if (s?.id) staffIds.push(s.id)
    }
    if (Array.isArray(vnDetail?.va)) {
      for (const va of vnDetail.va) {
        if (va?.character?.id) charIds.push(va.character.id)
        if (va?.staff?.id) staffIds.push(va.staff.id)
      }
    }
    const uniq = (arr) => Array.from(new Set(arr))
    const sids = uniq(staffIds)
    const cids = uniq(charIds)

    const [staffs, chars] = await Promise.all([
      vndbGetStaffByIds(sids),
      vndbGetCharactersByIds(cids)
    ])
    const staffMap = new Map()
    for (const st of staffs || []) staffMap.set(st.id, st)
    const charDetMap = new Map()
    for (const ch of chars || []) charDetMap.set(ch.id, ch)
    for (const [k, v] of charMap) {
      if (v?.source === 'vndb' && v?.kind === 'person' && v?.vndb_staff_id) {
        const st = staffMap.get(v.vndb_staff_id)
        if (st) {
          v.language = st.lang || v.language || ''
          v.links = (st.extlinks || []).map((l) => l?.url).filter(Boolean)
          v.aliases = [
            ...(Array.isArray(v.aliases) ? v.aliases : []),
            ...normalizeNamesFromVndbStaff(st).map((x) => x)
          ]
          v.descriptionEn = st.description || v.descriptionEn || ''
          const by = Number(st.birth_year || 0)
          const bm = Number(st.birth_mon || 0)
          const bd = Number(st.birth_day || 0)
          v.birthday = by ? by : v.birthday || ''
          v.blood_type = st.blood_type || v.blood_type || ''
        }
      }
      if (v?.source === 'vndb' && v?.kind === 'character' && v?.vndb_char_id) {
        const ch = charDetMap.get(v.vndb_char_id)
        if (ch) {
          const g = Array.isArray(ch.gender)
            ? String(ch.gender[0] || '').toLowerCase()
            : String(ch.gender || '').toLowerCase()
          v.gender =
            g === 'm'
              ? 'male'
              : g === 'f'
                ? 'female'
                : g === 'o'
                  ? 'non-binary'
                  : g === 'a'
                    ? 'ambiguous'
                    : v.gender || 'unknown'
          v.descriptionEn = ch.description || v.descriptionEn || ''
          v.height = Number(ch.height || 0)
          v.weight = Number(ch.weight || 0)
          v.bust = Number(ch.bust || 0)
          v.waist = Number(ch.waist || 0)
          v.hips = Number(ch.hips || 0)
          v.cup = ch.cup || v.cup || ''
          v.age = Number(ch.age || 0)
          try {
            const bd = Array.isArray(ch.birthday) ? ch.birthday : null
            if (bd && bd.length) {
              const mon = Number(bd[0] || 0)
              const day = Number(bd[1] || 0)
              if (mon) {
                let s = String(mon).padStart(2, '0')
                if (day) s += '-' + String(day).padStart(2, '0')
                v.birthday = v.birthday || s
              }
            }
          } catch {}
          v.char_aliases = [
            ...(Array.isArray(v.char_aliases) ? v.char_aliases : []),
            ...(ch.aliases || []).filter(Boolean)
          ]
          try {
            const vr = (ch.vns || []).find((x) => x?.id === vndbId)
            if (vr?.role) {
              const r = String(vr.role)
              v.role =
                r === 'main'
                  ? 'protagonist'
                  : r === 'primary'
                    ? 'main'
                    : r === 'side' || r === 'appears'
                      ? 'side'
                      : v.role || 'side'
            }
          } catch {}
        }
      }
    }
  } catch (e) {
    console.warn('augmentVndbDetails failed:', e?.message || e)
  }
}

/**
 * Create voice relations (character ↔ person) based on VNDB VA list.
 */
export async function linkVoices(vnDetail, patchId) {
  if (!vnDetail?.va?.length) return
  try {
    const chars = await prisma.patch_char.findMany({
      where: { patch_id: patchId }
    })
    const persons = await prisma.patch_person.findMany({
      where: { patch_id: patchId }
    })
    const charIdMap = new Map()
    for (const c of chars) {
      if (c.vndb_char_id) charIdMap.set(String(c.vndb_char_id), c.id)
      // 修正: 将 gm 替换为 c.bangumi_character_id
      if (c.bangumi_character_id) {
        charIdMap.set(String(c.bangumi_character_id), c.id)
      }
    }
    const personIdMap = new Map()
    for (const p of persons) {
      if (p.vndb_staff_id) personIdMap.set(String(p.vndb_staff_id), p.id)
      // 修正: 将 gm 替换为 p.bangumi_person_id
      if (p.bangumi_person_id) {
        personIdMap.set(String(p.bangumi_person_id), p.id)
      }
    }
    for (const va of vnDetail.va) {
      const chId = va?.character?.id
        ? charIdMap.get(String(va.character.id))
        : null
      const stId = va?.staff?.id ? personIdMap.get(String(va.staff.id)) : null
      if (chId && stId) {
        try {
          await prisma.patch_char_person_relation.create({
            data: {
              patch_char_id: chId,
              patch_person_id: stId,
              relation: 'voice'
            }
          })
        } catch {}
      }
    }
  } catch (e) {
    console.warn('linkVoices failed:', e?.message || e)
  }
}

/*
可优化的地方：
- 将匹配过程（normalize/compare）抽象为独立模块与测试；
- augmentVndbDetails 中的批量 id 查询可做分片或缓存；
- persistCharMap 可改为事务批量写入，减少往返与提升一致性。
*/
