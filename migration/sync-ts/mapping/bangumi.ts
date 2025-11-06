import {
  bgmGetCharacter,
  bgmGetPerson,
  bgmGetSubject,
  bgmGetSubjectCharacters,
  bgmGetSubjectPersons
} from '../api/bangumi'
import type { BgmSubject } from '../api/bangumi'
import type { CharMapValue, CharacterEntry, PersonEntry } from './types'
import { appendJsonLine, normalizeJaName, splitSummary } from './normalize'

export async function handleBangumiSubjectAndTags(
  subjectId: number,
  vnDetail: any,
  patchId: number,
  ownerId: number,
  prisma: any,
  upsertTagByName: (
    name: string,
    desc?: string,
    provider?: string,
    nameEn?: string,
    category?: string
  ) => Promise<number | null>
): Promise<BgmSubject | null> {
  if (!subjectId) return null
  try {
    const subject = await bgmGetSubject(subjectId)
    // dump raw JSON for inspection
    appendJsonLine('migration/sync-ts/data/patch.json', {
      provider: 'bangumi',
      id: subjectId,
      name: subject?.name || subject?.name_cn || '',
      data: subject
    }).catch(() => {})
    await prisma.patch
      .update({ where: { id: patchId }, data: { bid: subjectId } })
      .catch(() => {})
    // cover fallback
    if (!vnDetail?.image?.url && subject?.images?.large) {
      await prisma.patch_cover
        .upsert({
          where: { patch_id_image_id: { patch_id: patchId, image_id: '' } },
          update: { image_id: '', url: subject.images.large },
          create: { patch_id: patchId, image_id: '', url: subject.images.large }
        })
        .catch(() => {})
    }
    const { chinese: zhFromSummary, japanese: jaFromSummary } = splitSummary(
      subject?.summary || ''
    )
    const zhName = subject?.name_cn || ''
    const jaName = (subject as any)?.nameJa || ''
    await prisma.patch
      .update({
        where: { id: patchId },
        data: {
          introduction_zh_cn: zhFromSummary,
          introduction_ja_jp: jaFromSummary,
          name_zh_cn: zhName,
          name_ja_jp: jaName
        }
      })
      .catch(() => {})

    // create patch_alias from bangumi names and infobox aliases
    try {
      const names = new Set<string>()
      const add = (s?: string | null) => {
        const v = String(s || '').trim()
        if (v) names.add(v)
      }
      add(subject?.name)
      add(subject?.name_cn)
      const inf = (subject as any)?.infobox || []
      const aliasEntry = Array.isArray(inf)
        ? inf.find((x: any) => x?.key === '别名' || x?.key === '別名')
        : null
      if (aliasEntry) {
        const v = aliasEntry.value
        const list: string[] = Array.isArray(v)
          ? v
              .map((i: any) => (typeof i === 'string' ? i : i?.v))
              .filter(Boolean)
          : v
            ? [v]
            : []
        for (const s of list) add(String(s))
      }
      if (names.size) {
        const existing = await prisma.patch_alias
          .findMany({ where: { patch_id: patchId }, select: { name: true } })
          .then((rows: any[]) => new Set(rows.map((r) => r.name)))
        const toCreate = Array.from(names).filter((n) => !existing.has(n))
        for (const n of toCreate)
          await prisma.patch_alias
            .create({ data: { patch_id: patchId, name: n } })
            .catch(() => {})
      }
    } catch {}

    // collect links from bangumi infobox
    try {
      const inf = (subject as any)?.infobox || []
      if (Array.isArray(inf)) {
        for (const item of inf) {
          const key = String(item?.key || '').trim()
          if (!key) continue
          const raw = item?.value
          const getUrl = (v: any): string => {
            if (!v) return ''
            if (typeof v === 'string') return v
            if (typeof v === 'object' && v.v) return String(v.v)
            return ''
          }
          const url = Array.isArray(raw) ? getUrl(raw[0]) : getUrl(raw)
          if (!url || !/^https?:\/\//i.test(url)) continue
          await prisma.patch_link
            .upsert({
              where: { patch_id_name: { patch_id: patchId, name: key } },
              update: { url },
              create: { patch_id: patchId, name: key, url }
            })
            .catch(() => {})
        }
      }
    } catch {}
    if (Array.isArray(subject?.tags) && subject.tags.length) {
      for (const tg of subject.tags) {
        const tname = tg?.name || ''
        const tid = await upsertTagByName(tname, '', 'bangumi', '', 'sexual')
        if (!tid) continue
        await prisma.patch_tag_relation
          .create({
            data: { patch_id: patchId, tag_id: tid, spoiler_level: 0 }
          })
          .then(() =>
            prisma.patch_tag
              .update({ where: { id: tid }, data: { count: { increment: 1 } } })
              .catch(() => {})
          )
          .catch(() => {})
      }
    }
    // name zh fallback from VNDB titles
    if (!zhName && Array.isArray(vnDetail?.titles)) {
      const zhHans =
        vnDetail.titles.find((t: any) => t.lang === 'zh-Hans')?.title || ''
      const zhHant =
        vnDetail.titles.find((t: any) => t.lang === 'zh-Hant')?.title || ''
      const zhFallback = zhHans || zhHant
      if (zhFallback)
        await prisma.patch
          .update({ where: { id: patchId }, data: { name_zh_cn: zhFallback } })
          .catch(() => {})
    }
    return subject
  } catch (e: any) {
    console.warn('Bangumi subject fetch failed:', e?.message || e)
    return null
  }
}

export async function addBangumiCharactersToCharMap(
  subjectId: number,
  charMap: Map<string, CharMapValue>
) {
  if (!subjectId) return
  try {
    const chars = await bgmGetSubjectCharacters(subjectId)
    for (const c of chars || []) {
      const k = `bgm-char:${c.id}`
      const ja = c.name || ''
      const zh = c.name_cn || ''
      const relation = String(c.relation || c.relation_name || '').toLowerCase()
      const roleSet = new Set<string>()
      if (relation.includes('主') || relation.includes('main'))
        roleSet.add('main')
      else if (relation) roleSet.add('supporting')
      const entry: CharacterEntry = {
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
      // match with existing VNDB character by Japanese name
      // Special rule: if Bangumi image ends with 'anidb.jpg', treat name-match as failed
      const bgmImageUrl = (
        c.images?.large ||
        c.images?.medium ||
        c.images?.small ||
        ''
      ).toString()
      const blockMatch = /anidb\.jpg$/i.test(bgmImageUrl)
      let targetKey: string | null = null
      if (!blockMatch) {
        for (const [ck, cv] of charMap.entries()) {
          if (cv && cv.kind === 'character') {
            const vJa = (cv as CharacterEntry).nameJa || ''
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
      }
      if (targetKey) {
        const prev = (charMap.get(targetKey) || {}) as CharacterEntry
        charMap.set(targetKey, {
          ...prev,
          bangumi_character_id: c.id,
          nameJa: prev.nameJa || ja,
          nameZh: prev.nameZh || zh,
          imagesBgm: c.images || prev.imagesBgm || null,
          zhSummary: entry.zhSummary || prev.zhSummary,
          jaSummary: entry.jaSummary || prev.jaSummary
        })
      } else if (!charMap.has(k)) {
        charMap.set(k, entry)
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
          const yy = String(by % 100).padStart(2, '0')
          const mm = bm ? String(bm).padStart(2, '0') : ''
          const dd = bd ? String(bd).padStart(2, '0') : ''
          bdayStr = yy + (mm ? '-' + mm : '') + (dd ? '-' + dd : '')
        }
        const gl = g.trim().toLowerCase()
        const mappedGender =
          gl === 'male' || gl === 'm' || g.includes('男')
            ? 'male'
            : gl === 'female' || gl === 'f' || g.includes('女')
              ? 'female'
              : 'unknown'
        const infobox = cdetail?.infobox || []
        const apply = (key: string) => {
          const prev = (charMap.get(key) || entry) as CharacterEntry
          charMap.set(key, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary,
            gender: mappedGender || prev.gender,
            // Prefer Bangumi full date (YY-MM-DD). If prev is only MM-DD, override.
            birthday:
              prev.birthday &&
              /^(\d{2}-\d{2}|\d-\d{1,2}|\d{1,2}-\d)$/.test(prev.birthday)
                ? bdayStr || prev.birthday
                : prev.birthday || bdayStr,
            infobox: infobox || prev.infobox
          })
        }
        if (targetKey) apply(targetKey)
        else apply(k)
        // infobox: zh name + aliases + BWH
        const inf = infobox || []
        const zhName = inf.find((x: any) => x.key === '简体中文名')?.value || ''
        if (zhName) {
          const prev = (charMap.get(targetKey || k) || entry) as CharacterEntry
          charMap.set(targetKey || k, {
            ...prev,
            nameZh: prev.nameZh || String(zhName)
          })
        }
        const aliasEntry = inf.find((x: any) => x.key === '别名')
        if (aliasEntry) {
          const vals: string[] = Array.isArray(aliasEntry.value)
            ? aliasEntry.value
                .map((i: any) => (typeof i === 'string' ? i : i?.v))
                .filter(Boolean)
            : aliasEntry.value
              ? [aliasEntry.value]
              : []
          if (vals.length) {
            const prev = (charMap.get(targetKey || k) ||
              entry) as CharacterEntry
            const merged = Array.from(
              new Set([...(prev.char_aliases || []), ...vals])
            )
            charMap.set(targetKey || k, { ...prev, char_aliases: merged })
          }
        }
        const bwhEntry = inf.find(
          (x: any) => x.key && String(x.key).toUpperCase() === 'BWH'
        )
        if (bwhEntry && typeof bwhEntry.value === 'string') {
          const m = bwhEntry.value.match(/B(\d+)\s*\/\s*W(\d+)\s*\/\s*H(\d+)/i)
          if (m) {
            const [, B, W, H] = m
            const prev = (charMap.get(targetKey || k) ||
              entry) as CharacterEntry
            charMap.set(targetKey || k, {
              ...prev,
              bust: Number(B) || 0,
              waist: Number(W) || 0,
              hips: Number(H) || 0
            })
          }
        }
      } catch {}
    }
  } catch (e: any) {
    console.warn('Bangumi characters fetch failed:', e?.message || e)
  }
}

export async function addBangumiPersonsAndCompanies(
  subjectId: number,
  patchId: number,
  charMap: Map<string, CharMapValue>,
  prisma: any,
  upsertCompanyByName: (
    name: string,
    lang?: string | null,
    aliases?: string[],
    websites?: string[],
    introEn?: string
  ) => Promise<number | null>
) {
  if (!subjectId) return
  try {
    const persons = await bgmGetSubjectPersons(subjectId)
    const companyIds = new Set<number>()
    for (const p of persons || []) {
      if (p.type === 2) {
        const compId = await upsertCompanyByName(p.name || '', null, [], [])
        if (compId) companyIds.add(compId)
        if (p.summary) {
          const { chinese, japanese } = splitSummary(p.summary)
          await prisma.patch_company
            .update({
              where: { id: compId },
              data: {
                introduction_zh_cn: chinese,
                introduction_ja_jp: japanese
              }
            })
            .catch(() => {})
        }
        const logoUrl =
          p.images?.large || p.images?.medium || p.images?.small || ''
        if (logoUrl)
          await prisma.patch_company
            .update({ where: { id: compId }, data: { logo: logoUrl } })
            .catch(() => {})
        try {
          const detail = await bgmGetPerson(p.id)
          const { chinese, japanese } = splitSummary(detail?.summary || '')
          await prisma.patch_company
            .update({
              where: { id: compId },
              data: {
                introduction_zh_cn: chinese,
                introduction_ja_jp: japanese
              }
            })
            .catch(() => {})
          const dlogo =
            detail?.images?.large ||
            detail?.images?.medium ||
            detail?.images?.small ||
            ''
          if (dlogo)
            await prisma.patch_company
              .update({ where: { id: compId }, data: { logo: dlogo } })
              .catch(() => {})
        } catch {}
      } else {
        const k = `bgm-person:${p.id}`
        const ja = p.name || ''
        const base: PersonEntry = {
          source: 'bangumi',
          kind: 'person',
          bangumi_person_id: p.id,
          name: p.name || '',
          nameJa: ja,
          imagesBgm: p.images || null,
          roles: []
        }
        if (p.summary) {
          const { chinese, japanese } = splitSummary(p.summary)
          Object.assign(base, { zhSummary: chinese, jaSummary: japanese })
        }
        // match via normalized aliases
        let targetKey: string | null = null
        let detail: any = null
        try {
          detail = await bgmGetPerson(p.id)
        } catch {}
        const names = new Set<string>()
        if (p.name) names.add(normalizeJaName(p.name))
        const aliasEntry = (detail?.infobox || []).find(
          (x: any) => x && x.key && (x.key === '别名' || x.key === '別名')
        )
        if (aliasEntry) {
          const val = aliasEntry.value
          const list: string[] = Array.isArray(val)
            ? val
                .map((i: any) => (typeof i === 'string' ? i : i?.v))
                .filter(Boolean)
            : val
              ? [val]
              : []
          for (const s of list) names.add(normalizeJaName(String(s)))
        }
        for (const [ck, cv] of charMap.entries()) {
          if (cv && cv.kind === 'person' && cv.source === 'vndb') {
            const vnSet = new Set<string>(
              [
                normalizeJaName(cv.name || ''),
                normalizeJaName((cv as PersonEntry).nameJa || ''),
                ...((cv as PersonEntry).aliases || []).map((x) =>
                  normalizeJaName(String(x))
                )
              ].filter(Boolean)
            )
            if (Array.from(names).some((n) => vnSet.has(n))) {
              targetKey = ck
              break
            }
          }
        }
        if (targetKey) {
          const prev = (charMap.get(targetKey) || {}) as PersonEntry
          charMap.set(targetKey, {
            ...prev,
            bangumi_person_id: p.id,
            nameJa: prev.nameJa || ja,
            imagesBgm: p.images || prev.imagesBgm || null,
            zhSummary: base.zhSummary || prev.zhSummary,
            jaSummary: base.jaSummary || prev.jaSummary
          })
        } else if (!charMap.has(k)) {
          charMap.set(k, base)
        }
        appendJsonLine('migration/sync/data/char.json', {
          provider: 'bangumi',
          kind: 'person',
          id: p.id,
          name: p.name || '',
          data: p
        }).catch(() => {})
        // enrich detail (apply to whichever key active)
        try {
          const detail2 = detail || (await bgmGetPerson(p.id))
          const { chinese, japanese } = splitSummary(detail2?.summary || '')
          const activeKey = targetKey || k
          const prev = (charMap.get(activeKey) || base) as PersonEntry
          charMap.set(activeKey, {
            ...prev,
            zhSummary: chinese || prev.zhSummary,
            jaSummary: japanese || prev.jaSummary
          })
          const inf = detail2?.infobox || []
          const zhName =
            inf.find((x: any) => x.key === '简体中文名')?.value || ''
          if (zhName) {
            const pv = (charMap.get(activeKey) || base) as PersonEntry
            charMap.set(activeKey, {
              ...pv,
              nameZh: pv.nameZh || String(zhName)
            })
          }
          const aliasEntry2 = inf.find((x: any) => x.key === '别名')
          if (aliasEntry2) {
            const vals: string[] = Array.isArray(aliasEntry2.value)
              ? aliasEntry2.value
                  .map((i: any) => (typeof i === 'string' ? i : i?.v))
                  .filter(Boolean)
              : aliasEntry2.value
                ? [aliasEntry2.value]
                : []
            if (vals.length) {
              const pv = (charMap.get(activeKey) || base) as PersonEntry
              const merged = Array.from(
                new Set([...(pv.aliases || []), ...vals])
              )
              charMap.set(activeKey, { ...pv, aliases: merged })
            }
          }
          const by = Number(detail2?.birth_year || 0)
          const bm = Number(detail2?.birth_mon || 0)
          const bd = Number(detail2?.birth_day || 0)
          let bday = ''
          if (by) {
            const yy = String(by % 100).padStart(2, '0')
            const mm = bm ? String(bm).padStart(2, '0') : ''
            const dd = bd ? String(bd).padStart(2, '0') : ''
            bday = yy + (mm ? '-' + mm : '') + (dd ? '-' + dd : '')
          }
          const pv2 = (charMap.get(activeKey) || base) as PersonEntry
          charMap.set(activeKey, {
            ...pv2,
            birthday: pv2.birthday || bday,
            blood_type: pv2.blood_type || String(detail2?.blood_type || '')
          })
          const mapKeys: Array<[string, keyof PersonEntry]> = [
            ['引用来源', 'reference_source'],
            ['出生地', 'birthplace'],
            ['事务所', 'office'],
            ['Twitter', 'x'],
            ['配偶', 'spouse'],
            ['官方网站', 'official_website'],
            ['个人博客', 'blog']
          ]
          for (const [ik, fk] of mapKeys) {
            const v = inf.find((x: any) => x.key === ik)?.value
            if (v) {
              const pv3 = (charMap.get(activeKey) || base) as PersonEntry
              const str = Array.isArray(v) ? v[0]?.v || v[0] || '' : v
              charMap.set(activeKey, { ...pv3, [fk]: String(str) } as any)
            }
          }
        } catch {}
      }
    }
    for (const compId of companyIds) {
      await prisma.patch_company_relation
        .create({ data: { patch_id: patchId, company_id: compId } })
        .catch(() => {})
      await prisma.patch_company
        .update({ where: { id: compId }, data: { count: { increment: 1 } } })
        .catch(() => {})
    }
  } catch (e: any) {
    console.warn('Bangumi persons fetch failed:', e?.message || e)
  }
}
