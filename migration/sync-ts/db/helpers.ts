import { prisma } from './prisma'

// In-process caches
const globalTagMap = new Map<string, number>() // provider:name -> id
const globalCompanyMap = new Map<string, number>() // name -> id

export async function clearLegacyTables() {
  const tables = [
    'patch_company_relation',
    'patch_tag_relation',
    'patch_alias',
    'patch_cover',
    'patch_screenshot',
    'patch_char',
    'patch_person',
    'patch_release',
    'patch_company',
    'patch_tag'
  ]
  const sql = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`
  await prisma.$executeRawUnsafe(sql).catch((e) => {
    console.warn('truncate error:', e?.message || e)
  })
}

export async function upsertTagByName(
  name: string,
  description: string = '',
  ownerId: number = 1,
  provider: string = '',
  nameEn: string = '',
  category: string = 'content'
): Promise<number | null> {
  if (!name) return null
  const key = `${provider}:${name}`
  if (globalTagMap.has(key)) return globalTagMap.get(key)!
  const tag = await prisma.patch_tag.create({
    data: {
      name,
      provider,
      name_en_us: nameEn,
      introduction: description,
      introduction_zh_cn: '',
      introduction_ja_jp: '',
      introduction_en_us: '',
      alias: [],
      category,
      user_id: ownerId
    }
  })
  globalTagMap.set(key, tag.id)
  return tag.id
}

export async function upsertCompanyByName(
  name: string,
  lang: string | null = null,
  aliases: string[] = [],
  websites: string[] = [],
  ownerId: number = 1,
  introEn: string = ''
): Promise<number | null> {
  if (!name) return null
  if (globalCompanyMap.has(name)) return globalCompanyMap.get(name)!
  const primaryLanguage = lang ? [lang] : []
  const company = await prisma.patch_company.create({
    data: {
      name,
      logo: '',
      introduction: '',
      introduction_zh_cn: '',
      introduction_ja_jp: '',
      introduction_en_us: introEn || '',
      count: 0,
      primary_language: primaryLanguage,
      official_website: websites,
      parent_brand: [],
      alias: Array.isArray(aliases) ? aliases.filter(Boolean) : [],
      user_id: ownerId
    }
  })
  globalCompanyMap.set(name, company.id)
  return company.id
}

// Safe lowercase helper for vndb_id with unique guard
export async function lowercaseVndbIdSafely() {
  const patches = await prisma.patch.findMany({
    where: { NOT: { vndb_id: null } },
    select: { id: true, vndb_id: true }
  })
  let updated = 0
  for (const p of patches) {
    const lower = String(p.vndb_id || '').toLowerCase()
    if (p.vndb_id !== lower) {
      try {
        const conflict = await prisma.patch.findFirst({
          where: { vndb_id: lower },
          select: { id: true }
        })
        if (conflict && conflict.id !== p.id) {
          await prisma.patch.update({
            where: { id: p.id },
            data: { vndb_id: null }
          })
          console.warn(
            `lowercaseVndbId: skip patch ${p.id}, lowercase '${lower}' already used by patch ${conflict.id}; set current vndb_id to null`
          )
        } else {
          await prisma.patch.update({
            where: { id: p.id },
            data: { vndb_id: lower }
          })
          updated++
          console.log(
            `lowercaseVndbId: updated patch ${p.id}: ${p.vndb_id} -> ${lower}`
          )
        }
      } catch (err: any) {
        console.warn(
          `lowercaseVndbId: failed to update patch ${p.id}:`,
          err?.message || err
        )
      }
    }
  }
  console.log(`lowercaseVndbId: done, updated ${updated} patches.`)
}
