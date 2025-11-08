import { prisma } from '~/prisma/index'
import {
  vndbGetVnById,
  vndbGetReleasesByVn,
  type VndbVnDetail
} from './clients/vndb'
import { bgmSearchSubjects, bgmGetSubject } from './clients/bangumi'
import { cleanupPatchSideEffects } from './cleanup'
import {
  mapVndbTagToZh,
  pickJapaneseTitle,
  upsertCompanyByName,
  upsertTagByName
} from './helpers'

const deriveBangumiSubjectId = async (
  patchName: string,
  vn: VndbVnDetail | null
): Promise<number | null> => {
  try {
    let jaTitle: string | null = null
    if (vn?.titles?.length) {
      const jaItem = vn.titles.find(
        (t) =>
          String(t?.lang || '')
            .toLowerCase()
            .split('-')[0] === 'ja'
      )
      jaTitle = (jaItem?.title as string) || null
    }
    if (jaTitle) {
      const byJa = await bgmSearchSubjects(jaTitle)
      if (byJa?.length) return byJa[0]?.id || null
    }
    const byNm = await bgmSearchSubjects(patchName)
    if (byNm?.length) return byNm[0]?.id || null
  } catch {}
  return null
}

const syncPatchNames = async (patchId: number, vn: VndbVnDetail | null) => {
  const nameEn = vn?.title || ''
  const nameJa = vn ? pickJapaneseTitle(vn) : ''
  await prisma.patch
    .update({
      where: { id: patchId },
      data: { name_en_us: nameEn, name_ja_jp: nameJa }
    })
    .catch(() => {})
}

const syncPatchDescription = async (
  patchId: number,
  vn: VndbVnDetail | null
) => {
  if (!vn?.description) return
  let text = String(vn.description || '')
  const lines = text.split(/\n+/)
  if (lines.length) {
    const last = (lines[lines.length - 1] || '').trim()
    if (last.startsWith('[')) lines.pop()
  }
  const processed = lines.join('\n').trim()
  await prisma.patch
    .update({ where: { id: patchId }, data: { introduction_en_us: processed } })
    .catch(() => {})
}

const syncPatchCover = async (patchId: number, vn: VndbVnDetail | null) => {
  if (!vn?.image?.url) return
  const c = vn.image
  await prisma.patch_cover
    .upsert({
      where: {
        patch_id_image_id: {
          patch_id: patchId,
          image_id: c.id ? String(c.id) : ''
        }
      },
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
    .catch(() => {})
}

const syncPatchScreenshots = async (
  patchId: number,
  vn: VndbVnDetail | null
) => {
  if (!Array.isArray(vn?.screenshots) || !vn!.screenshots!.length) return
  for (let i = 0; i < vn!.screenshots!.length; i++) {
    const s = vn!.screenshots![i]
    await prisma.patch_screenshot
      .create({
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
      .catch(() => {})
  }
}

const syncPatchTags = async (patchId: number, vn: VndbVnDetail | null) => {
  if (!Array.isArray(vn?.tags) || !vn!.tags!.length) return
  for (const t of vn!.tags!) {
    const nameEn = t.name || ''
    const nameZh = mapVndbTagToZh(nameEn)
    let category = 'content'
    if (t.category === 'ero') category = 'sexual'
    else if (t.category === 'tech') category = 'technical'
    const tagId = await upsertTagByName(
      nameZh,
      t.description || '',
      'vndb',
      nameEn,
      category
    )
    if (!tagId) continue
    await prisma.patch_tag
      .update({
        where: { id: tagId },
        data: { introduction_en_us: t.description || '' }
      })
      .catch(() => {})
    await prisma.patch_tag_relation
      .create({
        data: {
          patch_id: patchId,
          tag_id: tagId,
          spoiler_level: Number.isInteger(t.spoiler) ? (t.spoiler as number) : 0
        }
      })
      .then(() =>
        prisma.patch_tag.update({
          where: { id: tagId },
          data: { count: { increment: 1 } }
        })
      )
      .catch(() => {})
  }
}

const syncPatchLinks = async (patchId: number, vn: VndbVnDetail | null) => {
  const links = Array.isArray(vn?.extlinks) ? vn!.extlinks! : []
  for (const l of links) {
    const nm = String(l?.name || l?.label || '').trim()
    const url = String(l?.url || '').trim()
    if (!nm || !url) continue
    await prisma.patch_link
      .upsert({
        where: { patch_id_name: { patch_id: patchId, name: nm } },
        update: { url },
        create: { patch_id: patchId, name: nm, url }
      })
      .catch(() => {})
  }
}

const syncReleasesAndCompanies = async (
  patchId: number,
  vnId: string,
  vn: VndbVnDetail | null
) => {
  const releases = await vndbGetReleasesByVn(vnId)
  const companyIds = new Set<number>()
  for (let i = 0; i < releases.length; i++) {
    const r = releases[i]
    try {
      if (Array.isArray((r as any).images)) {
        for (const img of (r as any).images) {
          if (!img?.url) continue
          await prisma.patch_cover
            .upsert({
              where: {
                patch_id_image_id: {
                  patch_id: patchId,
                  image_id: img.id ? String(img.id) : ''
                }
              },
              update: {
                image_id: img.id ? String(img.id) : '',
                url: img.url || '',
                width: Array.isArray(img.dims) ? img.dims[0] : 0,
                height: Array.isArray(img.dims) ? img.dims[1] : 0,
                sexual: typeof img.sexual === 'number' ? img.sexual : 0,
                violence: typeof img.violence === 'number' ? img.violence : 0,
                votecount:
                  typeof img.votecount === 'number' ? img.votecount : 0,
                thumbnail_url: img.thumbnail || '',
                thumb_width: Array.isArray(img.thumbnail_dims)
                  ? img.thumbnail_dims[0]
                  : 0,
                thumb_height: Array.isArray(img.thumbnail_dims)
                  ? img.thumbnail_dims[1]
                  : 0
              },
              create: {
                patch_id: patchId,
                image_id: img.id ? String(img.id) : '',
                url: img.url || '',
                width: Array.isArray(img.dims) ? img.dims[0] : 0,
                height: Array.isArray(img.dims) ? img.dims[1] : 0,
                sexual: typeof img.sexual === 'number' ? img.sexual : 0,
                violence: typeof img.violence === 'number' ? img.violence : 0,
                votecount:
                  typeof img.votecount === 'number' ? img.votecount : 0,
                thumbnail_url: img.thumbnail || '',
                thumb_width: Array.isArray(img.thumbnail_dims)
                  ? img.thumbnail_dims[0]
                  : 0,
                thumb_height: Array.isArray(img.thumbnail_dims)
                  ? img.thumbnail_dims[1]
                  : 0
              }
            })
            .catch(() => {})
        }
      }
      if (Array.isArray(r.producers)) {
        for (const p of r.producers) {
          const compId = await upsertCompanyByName(
            p.name || p.original || '',
            p.lang || null,
            p.aliases || [],
            (p.extlinks || []).map((el) => el.url).filter(Boolean),
            p.description || ''
          )
          if (compId) companyIds.add(compId)
        }
      }
      let rid = r.id ? String(r.id) : ''
      if (!rid) rid = `v-${vnId}-${i + 1}`
      await prisma.patch_release
        .upsert({
          where: { rid },
          update: {
            patch_id: patchId,
            title: r.title ?? '',
            released: r.released || '',
            platforms: Array.isArray(r.platforms) ? r.platforms : [],
            languages: Array.isArray(r.languages)
              ? (r.languages as any[])
                  .map((x) => (x as any).lang || x)
                  .filter(Boolean)
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
              ? (r.languages as any[])
                  .map((x) => (x as any).lang || x)
                  .filter(Boolean)
              : [],
            minage: typeof r.minage === 'number' ? r.minage : 0
          }
        })
        .catch(() => {})
    } catch {}
  }
  for (const compId of companyIds) {
    await prisma.patch_company_relation
      .create({ data: { patch_id: patchId, company_id: compId } })
      .catch(() => {})
    await prisma.patch_company
      .update({ where: { id: compId }, data: { count: { increment: 1 } } })
      .catch(() => {})
  }
}

export const syncPatchFromApis = async (
  patchId: number,
  nextVndbId: string | null
) => {
  // Load current patch to compare vndb id
  const current = await prisma.patch.findUnique({
    where: { id: patchId },
    select: { id: true, name: true, vndb_id: true, bid: true }
  })
  if (!current) return

  const oldVndbId = current.vndb_id || null
  const newVndbId = nextVndbId || null

  // Persist new VNDB id
  await prisma.patch
    .update({ where: { id: patchId }, data: { vndb_id: newVndbId } })
    .catch(() => {})

  // Cleanup if changed
  if (oldVndbId !== newVndbId) await cleanupPatchSideEffects(patchId)

  // If no VNDB id, clear Japanese name and return
  if (!newVndbId) {
    await prisma.patch
      .update({ where: { id: patchId }, data: { name_ja_jp: '' } })
      .catch(() => {})
    return
  }

  // Fetch VNDB detail
  const vn = await vndbGetVnById(newVndbId)
  await syncPatchNames(patchId, vn)
  await syncPatchDescription(patchId, vn)
  await syncPatchCover(patchId, vn)
  await syncPatchScreenshots(patchId, vn)
  await syncPatchTags(patchId, vn)
  await syncPatchLinks(patchId, vn)
  await syncReleasesAndCompanies(patchId, newVndbId, vn)

  // Persons & Characters (VNDB based)
  await syncPersonsAndCharactersVndb(patchId, vn)

  // Bangumi subject
  const subjectId = await deriveBangumiSubjectId(current.name, vn)
  if (subjectId) {
    await prisma.patch
      .update({ where: { id: patchId }, data: { bid: subjectId } })
      .catch(() => {})
    const subject = await bgmGetSubject(subjectId)
    // cover fallback
    if (!vn?.image?.url && subject?.images?.large) {
      await prisma.patch_cover
        .upsert({
          where: { patch_id_image_id: { patch_id: patchId, image_id: '' } },
          update: { image_id: '', url: subject.images.large },
          create: { patch_id: patchId, image_id: '', url: subject.images.large }
        })
        .catch(() => {})
    }
    // summary split: naive approach (this project had splitSummary; here we only set zh if exists)
    if (subject?.summary) {
      await prisma.patch
        .update({
          where: { id: patchId },
          data: { introduction_zh_cn: subject.summary }
        })
        .catch(() => {})
    }
    // tags
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
            prisma.patch_tag.update({
              where: { id: tid },
              data: { count: { increment: 1 } }
            })
          )
          .catch(() => {})
      }
    }
  }
}

const syncPersonsAndCharactersVndb = async (
  patchId: number,
  vn: VndbVnDetail | null
) => {
  if (!vn) return
  const seenPerson = new Set<string>()
  const seenChar = new Set<string>()

  // From VA pairs
  for (const va of vn.va || []) {
    const ch = va.character
    if (ch?.id && !seenChar.has(ch.id)) {
      seenChar.add(ch.id)
      const nameJa = ch.original || ''
      const nameEn = ch.name || ''
      await upsertPatchChar(patchId, {
        vndb_char_id: ch.id,
        image: ch.image?.url || '',
        name_ja_jp: nameJa,
        name_en_us: nameEn
      })
    }
    const staff = va.staff
    if (staff?.id && !seenPerson.has(staff.id)) {
      seenPerson.add(staff.id)
      const nameJa = staff.original || ''
      const nameEn = staff.name || ''
      await upsertPatchPerson(patchId, {
        vndb_staff_id: staff.id,
        name_ja_jp: nameJa,
        name_en_us: nameEn
      })
    }
    // Link voice globally (char-person)
    if (ch?.id && staff?.id) await linkVoice(ch.id, staff.id)
  }

  // From VN staff list (non-VA roles)
  for (const s of vn.staff || []) {
    if (!s?.id) continue
    if (seenPerson.has(s.id)) continue
    seenPerson.add(s.id)
    await upsertPatchPerson(patchId, {
      vndb_staff_id: s.id,
      name_ja_jp: s.original || '',
      name_en_us: s.name || ''
    })
  }
}

const upsertPatchChar = async (
  patchId: number,
  data: {
    vndb_char_id: string
    image?: string
    name_ja_jp?: string
    name_en_us?: string
  }
) => {
  const base = {
    image: data.image || '',
    name_ja_jp: data.name_ja_jp || '',
    name_en_us: data.name_en_us || ''
  }
  const existing = await prisma.patch_char.findUnique({
    where: { vndb_char_id: data.vndb_char_id }
  })
  const rec = existing
    ? await prisma.patch_char.update({ where: { id: existing.id }, data: base })
    : await prisma.patch_char.create({
        data: { ...base, vndb_char_id: data.vndb_char_id }
      })
  await prisma.patch_char_relation
    .upsert({
      where: {
        patch_id_patch_char_id: { patch_id: patchId, patch_char_id: rec.id }
      },
      update: {},
      create: { patch_id: patchId, patch_char_id: rec.id }
    })
    .catch(() => {})
}

const upsertPatchPerson = async (
  patchId: number,
  data: { vndb_staff_id: string; name_ja_jp?: string; name_en_us?: string }
) => {
  const base = {
    name_ja_jp: data.name_ja_jp || '',
    name_en_us: data.name_en_us || ''
  }
  const existing = await prisma.patch_person.findUnique({
    where: { vndb_staff_id: data.vndb_staff_id }
  })
  const rec = existing
    ? await prisma.patch_person.update({
        where: { id: existing.id },
        data: base
      })
    : await prisma.patch_person.create({
        data: { ...base, vndb_staff_id: data.vndb_staff_id }
      })
  await prisma.patch_person_relation
    .upsert({
      where: {
        patch_id_patch_person_id: { patch_id: patchId, patch_person_id: rec.id }
      },
      update: {},
      create: { patch_id: patchId, patch_person_id: rec.id }
    })
    .catch(() => {})
}

const linkVoice = async (vndbCharId: string, vndbStaffId: string) => {
  try {
    const char = await prisma.patch_char.findUnique({
      where: { vndb_char_id: vndbCharId }
    })
    const person = await prisma.patch_person.findUnique({
      where: { vndb_staff_id: vndbStaffId }
    })
    if (!char || !person) return
    await prisma.patch_char_person_relation
      .create({
        data: {
          patch_char_id: char.id,
          patch_person_id: person.id,
          relation: 'voice'
        }
      })
      .catch(() => {})
  } catch {}
}
