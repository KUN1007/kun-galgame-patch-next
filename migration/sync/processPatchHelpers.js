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

async function appendPersonLog(record) {
  try {
    const outDir = path.join('migration', 'sync', 'data')
    await ensureDir(outDir)
    const outFile = path.join(outDir, 'char.json')
    let arr = []
    try {
      const src = await fs.readFile(outFile, 'utf8')
      const parsed = JSON.parse(src)
      if (Array.isArray(parsed)) arr = parsed
    } catch {}
    arr.push(record)
    await fs.writeFile(outFile, JSON.stringify(arr, null, 2))
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
        thumb_width: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[0] : null,
        thumb_height: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[1] : null
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
        thumb_width: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[0] : null,
        thumb_height: Array.isArray(c.thumbnail_dims) ? c.thumbnail_dims[1] : null
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
          thumb_width: Array.isArray(s.thumbnail_dims) ? s.thumbnail_dims[0] : null,
          thumb_height: Array.isArray(s.thumbnail_dims) ? s.thumbnail_dims[1] : null,
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
      if (!charMap.has(k))
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
        await prisma.patch_cover.upsert({
          where: { patch_id: patchId },
          update: { image_id: null, url: subject.images.large },
          create: { patch_id: patchId, image_id: null, url: subject.images.large }
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
      const ja = c.name || ''
      const zh = c.name_cn || ''
      const entry = {
        source: 'bangumi',
        kind: 'character',
        bangumi_character_id: c.id,
        name: c.name || c.name_cn || '',
        nameJa: ja,
        nameZh: zh,
        imagesBgm: c.images || null,
        roles: []
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
        if (targetKey) {
          const prev = charMap.get(targetKey) || entry
          charMap.set(targetKey, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary
          })
        } else {
          const prev = charMap.get(k) || entry
          charMap.set(k, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary
          })
        }
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

        // Try to match with existing VNDB staff by Japanese name
        let targetKey = null
        for (const [ck, cv] of charMap.entries()) {
          if (cv && cv.kind === 'person') {
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
      } catch {}
    }
    await sleep(200)
  } catch (e) {
    console.warn('Bangumi persons fetch failed:', e?.message || e)
  }
}

export async function persistCharMap(charMap, baseDir, patchId) {
  for (const [key, val] of charMap) {
    // Common fields shared by both models (excluding schema-specific ones)
    const common = {
      patch_id: patchId,
      name_zh_cn: val.nameZh || '',
      name_ja_jp: val.nameJa || '',
      name_en_us: val.nameEn || '',
      alias: [],
      image: '',
      description_zh_cn: val.zhSummary || null,
      description_ja_jp: val.jaSummary || null,
      description_en_us: null,
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
          kind: val.kind,
          vndb_staff_id: val.vndb_staff_id || null,
          bangumi_person_id: val.bangumi_person_id || null
        }
        // gender is optional on patch_person; only include if present
        if (val.gender) personData.gender = val.gender
        if (personData.vndb_staff_id) {
          await prisma.patch_person.upsert({
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
          await prisma.patch_person.upsert({
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
          await prisma.patch_person.create({ data: personData })
        }
      } else {
        const charData = {
          ...common,
          vndb_char_id: val.vndb_char_id || null,
          bangumi_character_id: val.bangumi_character_id || null
        }
        // patch_char.gender is non-nullable with a default; avoid sending null
        if (val.gender) charData.gender = val.gender
        if (charData.vndb_char_id) {
          await prisma.patch_char.upsert({
            where: {
              patch_id_vndb_char_id: {
                patch_id: charData.patch_id,
                vndb_char_id: charData.vndb_char_id
              }
            },
            update: charData,
            create: charData
          })
        } else if (charData.bangumi_character_id) {
          await prisma.patch_char.upsert({
            where: {
              patch_id_bangumi_character_id: {
                patch_id: charData.patch_id,
                bangumi_character_id: charData.bangumi_character_id
              }
            },
            update: charData,
            create: charData
          })
        } else {
          await prisma.patch_char.create({ data: charData })
        }
      }
    } catch (e) {
      console.warn('patch_char/person upsert failed:', e?.message || e)
    }
    await sleep(120)
  }
}
