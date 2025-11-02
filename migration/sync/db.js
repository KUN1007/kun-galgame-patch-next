import { prisma } from './dbClient.js'

const globalTagMap = new Map() // (provider:name) -> id
const globalCompanyMap = new Map() // name -> id

export async function clearLegacyTables() {
  const tables = [
    'patch_company_relation',
    'patch_tag_relation',
    'patch_alias',
    'patch_cover',
    'patch_screenshot',
    'patch_char_infobox',
    'patch_char',
    'patch_person',
    'patch_release',
    'patch_company',
    'patch_tag'
  ]
  const sql = `TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`
  try {
    await prisma.$executeRawUnsafe(sql)
  } catch (e) {
    console.warn('truncate error:', e?.message || e)
  }
}

export async function upsertTagByName(
  name,
  description = '',
  ownerId = 1,
  provider = '',
  nameEn = '',
  category = 'content'
) {
  if (!name) return null
  const key = `${provider}:${name}`
  if (globalTagMap.has(key)) return globalTagMap.get(key)
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
  name,
  lang = null,
  aliases = [],
  websites = [],
  ownerId = 1,
  introEn = ''
) {
  if (!name) return null
  if (globalCompanyMap.has(name)) return globalCompanyMap.get(name)
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
