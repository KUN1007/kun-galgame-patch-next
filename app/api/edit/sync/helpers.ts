import { prisma } from '~/prisma/index'
import { TAG_MAP } from '~/lib/tagMap'

export const pickJapaneseTitle = (vn: {
  titles?: any[]
  alttitle?: string | null
  olang?: string | null
}): string => {
  let nameJa = ''
  try {
    const titles = Array.isArray(vn?.titles) ? vn.titles : []
    const jaItem = titles.find(
      (t) =>
        String(t?.lang || '')
          .toLowerCase()
          .split('-')[0] === 'ja'
    )
    if (jaItem?.title) nameJa = String(jaItem.title)
    if (!nameJa) {
      const ol = String(vn?.olang || '').toLowerCase()
      const alt = vn?.alttitle || ''
      if (ol === 'ja' && alt) nameJa = String(alt)
    }
  } catch {}
  return nameJa
}

export const upsertCompanyByName = async (
  name: string,
  lang?: string | null,
  aliases?: string[],
  websites?: string[],
  intro?: string
): Promise<number | null> => {
  const nm = (name || '').trim()
  if (!nm) return null
  const existing = await prisma.patch_company.findFirst({ where: { name: nm } })
  if (existing) return existing.id
  const created = await prisma.patch_company.create({
    data: {
      name: nm,
      primary_language: lang ? [lang] : [],
      official_website: websites || [],
      alias: (aliases || []).filter(Boolean),
      introduction_en_us: intro || ''
    }
  })
  return created.id
}

export const upsertTagByName = async (
  zhName: string,
  desc: string,
  provider: 'vndb' | 'bangumi',
  enName: string,
  category: string
): Promise<number | null> => {
  const name = (zhName || '').trim() || (enName || '').trim()
  if (!name) return null
  const existing = await prisma.patch_tag.findFirst({ where: { name } })
  if (existing) return existing.id
  const created = await prisma.patch_tag.create({
    data: {
      name,
      provider,
      name_en_us: enName || '',
      category: category || 'content',
      introduction_en_us: desc || ''
    }
  })
  return created.id
}

export const mapVndbTagToZh = (en: string): string => {
  if (!en) return ''
  const mapped = (TAG_MAP as any)?.[en]
  return mapped || en
}
