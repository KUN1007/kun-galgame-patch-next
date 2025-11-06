import { prisma } from '../db/prisma'
import type { CharMapValue, CharacterEntry, PersonEntry } from './types'
import { sleep } from '../utils/sleep'

export async function persistCharMap(
  charMap: Map<string, CharMapValue>,
  patchId: number
) {
  for (const [, val] of charMap) {
    const base = {
      name_zh_cn: (val as any).nameZh || '',
      name_ja_jp: (val as any).nameJa || '',
      name_en_us: (val as any).nameEn || '',
      image: resolveImage(val),
      description_zh_cn: val.zhSummary || '',
      description_ja_jp: val.jaSummary || '',
      description_en_us: val.descriptionEn || '',
      roles: Array.isArray(val.roles) ? val.roles : []
    }
    try {
      if (val.kind === 'person') {
        const personData: any = {
          ...base,
          language: (val as PersonEntry).language || '',
          links: Array.isArray((val as PersonEntry).links)
            ? (val as PersonEntry).links!.filter(Boolean)
            : [],
          birthday: (val as PersonEntry).birthday
            ? String((val as PersonEntry).birthday)
            : '',
          blood_type: (val as PersonEntry).blood_type || '',
          reference_source: (val as PersonEntry).reference_source || '',
          birthplace: (val as PersonEntry).birthplace || '',
          office: (val as PersonEntry).office || '',
          x: (val as PersonEntry).x || '',
          spouse: (val as PersonEntry).spouse || '',
          official_website: (val as PersonEntry).official_website || '',
          blog: (val as PersonEntry).blog || ''
        }
        const vStaff = (val as PersonEntry).vndb_staff_id || null
        const bPid = (val as PersonEntry).bangumi_person_id || null
        let personRec: any = null
        // Merge strategy: find by either ID first, then update to include both IDs
        if (vStaff) {
          personRec = await prisma.patch_person.findUnique({
            where: { vndb_staff_id: vStaff }
          })
        }
        if (!personRec && bPid) {
          personRec = await prisma.patch_person.findUnique({
            where: { bangumi_person_id: bPid }
          })
        }
        if (personRec) {
          // Update existing, fill missing unique ids if available
          await prisma.patch_person
            .update({
              where: { id: personRec.id },
              data: {
                ...personData,
                ...(vStaff && !personRec.vndb_staff_id
                  ? { vndb_staff_id: vStaff }
                  : {}),
                ...(bPid && !personRec.bangumi_person_id
                  ? { bangumi_person_id: bPid }
                  : {})
              }
            })
            .catch(() => {})
        } else if (vStaff || bPid) {
          personRec = await prisma.patch_person
            .create({
              data: {
                ...personData,
                ...(vStaff ? { vndb_staff_id: vStaff } : {}),
                ...(bPid ? { bangumi_person_id: bPid } : {})
              }
            })
            .catch(async (e) => {
              // Last resort: try upsert by whichever ID exists to avoid race
              if (bPid) {
                return prisma.patch_person.upsert({
                  where: { bangumi_person_id: bPid },
                  update: personData,
                  create: { ...personData, bangumi_person_id: bPid }
                })
              }
              if (vStaff) {
                return prisma.patch_person.upsert({
                  where: { vndb_staff_id: vStaff },
                  update: personData,
                  create: { ...personData, vndb_staff_id: vStaff }
                })
              }
            })
        } else {
          personRec = await prisma.patch_person.create({ data: personData })
        }
        const aliases = Array.isArray((val as PersonEntry).aliases)
          ? Array.from(
              new Set(
                ((val as PersonEntry).aliases || [])
                  .map((x) => String(x).trim())
                  .filter(Boolean)
              )
            )
          : []
        if (personRec) {
          // link patch-person relation (many-to-many)
          await prisma.patch_person_relation
            .upsert({
              where: {
                patch_id_patch_person_id: {
                  patch_id: patchId,
                  patch_person_id: personRec.id
                }
              },
              update: {},
              create: { patch_id: patchId, patch_person_id: personRec.id }
            })
            .catch(() => {})
        }
        if (personRec && aliases.length) {
          try {
            await prisma.patch_person_alias.createMany({
              data: aliases.map((name) => ({ name, person_id: personRec.id })),
              skipDuplicates: true
            })
          } catch {
            for (const name of aliases)
              await prisma.patch_person_alias
                .create({ data: { name, person_id: personRec.id } })
                .catch(() => {})
          }
        }
      } else {
        const charData: any = {
          ...base,
          infobox: JSON.stringify((val as CharacterEntry).infobox || []),
          gender: (val as CharacterEntry).gender || 'unknown',
          role: (val as CharacterEntry).role || 'side',
          birthday: (val as CharacterEntry).birthday
            ? String((val as CharacterEntry).birthday)
            : '',
          bust: Number((val as CharacterEntry).bust || 0),
          waist: Number((val as CharacterEntry).waist || 0),
          hips: Number((val as CharacterEntry).hips || 0),
          height: Number((val as CharacterEntry).height || 0),
          weight: Number((val as CharacterEntry).weight || 0),
          cup: (val as CharacterEntry).cup || '',
          age: Number((val as CharacterEntry).age || 0)
        }
        const vChar = (val as CharacterEntry).vndb_char_id || null
        const bCid = (val as CharacterEntry).bangumi_character_id || null
        if (vChar) charData.vndb_char_id = vChar
        if (bCid) charData.bangumi_character_id = bCid
        let charRec: any = null
        if (vChar) {
          charRec = await prisma.patch_char.findUnique({
            where: { vndb_char_id: vChar }
          })
        }
        if (!charRec && bCid) {
          charRec = await prisma.patch_char.findUnique({
            where: { bangumi_character_id: bCid }
          })
        }
        if (charRec) {
          await prisma.patch_char
            .update({
              where: { id: charRec.id },
              data: {
                ...charData,
                ...(vChar && !charRec.vndb_char_id
                  ? { vndb_char_id: vChar }
                  : {}),
                ...(bCid && !charRec.bangumi_character_id
                  ? { bangumi_character_id: bCid }
                  : {})
              }
            })
            .catch(() => {})
        } else if (vChar || bCid) {
          charRec = await prisma.patch_char
            .create({ data: charData })
            .catch(async () => {
              if (bCid) {
                return prisma.patch_char.upsert({
                  where: { bangumi_character_id: bCid },
                  update: charData,
                  create: { ...charData, bangumi_character_id: bCid }
                })
              }
              if (vChar) {
                return prisma.patch_char.upsert({
                  where: { vndb_char_id: vChar },
                  update: charData,
                  create: { ...charData, vndb_char_id: vChar }
                })
              }
            })
        } else {
          charRec = await prisma.patch_char.create({ data: charData })
        }
        const charAliases = Array.isArray((val as CharacterEntry).char_aliases)
          ? Array.from(
              new Set(
                ((val as CharacterEntry).char_aliases || [])
                  .map((x) => String(x).trim())
                  .filter(Boolean)
              )
            )
          : []
        if (charRec) {
          // link patch-char relation (many-to-many)
          await prisma.patch_char_relation
            .upsert({
              where: {
                patch_id_patch_char_id: {
                  patch_id: patchId,
                  patch_char_id: charRec.id
                }
              },
              update: {},
              create: { patch_id: patchId, patch_char_id: charRec.id }
            })
            .catch(() => {})
        }
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
            for (const name of charAliases)
              await prisma.patch_char_alias
                .create({ data: { name, patch_char_id: charRec.id } })
                .catch(() => {})
          }
        }
      }
    } catch (e: any) {
      console.warn('persist char/person failed:', e?.message || e)
    }
    await sleep(100)
  }
}

function resolveImage(v: CharMapValue): string {
  const b = (v as any).imagesBgm
  const vd = (v as any).imagesVndb
  return b?.large || b?.medium || b?.small || vd?.url || ''
}

export async function linkVoices(vnDetail: any, patchId: number) {
  if (!vnDetail?.va?.length) return
  try {
    const charRels = await prisma.patch_char_relation.findMany({
      where: { patch_id: patchId },
      include: { char: true }
    })
    const chars = charRels.map((r) => r.char)
    const personRels = await prisma.patch_person_relation.findMany({
      where: { patch_id: patchId },
      include: { person: true }
    })
    const persons = personRels.map((r) => r.person)
    const charIdMap = new Map<string, number>()
    for (const c of chars) {
      if (c.vndb_char_id) charIdMap.set(String(c.vndb_char_id), c.id)
      if (c.bangumi_character_id)
        charIdMap.set(String(c.bangumi_character_id), c.id)
    }
    const personIdMap = new Map<string, number>()
    for (const p of persons) {
      if (p.vndb_staff_id) personIdMap.set(String(p.vndb_staff_id), p.id)
      if (p.bangumi_person_id)
        personIdMap.set(String(p.bangumi_person_id), p.id)
    }
    for (const va of vnDetail.va) {
      const chId = va?.character?.id
        ? charIdMap.get(String(va.character.id))
        : null
      const stId = va?.staff?.id ? personIdMap.get(String(va.staff.id)) : null
      if (chId && stId) {
        await prisma.patch_char_person_relation
          .create({
            data: {
              patch_char_id: chId,
              patch_person_id: stId,
              relation: 'voice'
            }
          })
          .catch(() => {})
      }
    }
  } catch (e: any) {
    console.warn('linkVoices failed:', e?.message || e)
  }
}
