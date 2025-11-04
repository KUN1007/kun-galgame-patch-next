export type SourceProvider = 'vndb' | 'bangumi'

export interface BaseEntry {
  source: SourceProvider
  kind: 'character' | 'person'
  name: string
  nameEn?: string
  nameJa?: string
  nameZh?: string
  imagesVndb?: { url?: string } | null
  imagesBgm?: { large?: string; medium?: string; small?: string } | null
  roles?: string[]
  zhSummary?: string
  jaSummary?: string
  descriptionEn?: string
}

export interface CharacterEntry extends BaseEntry {
  kind: 'character'
  vndb_char_id?: string
  bangumi_character_id?: number
  gender?: string
  infobox?: any
  // body metrics
  height?: number
  weight?: number
  bust?: number
  waist?: number
  hips?: number
  cup?: string
  age?: number
  role?: 'protagonist' | 'main' | 'side'
  char_aliases?: string[]
  birthday?: string
}

export interface PersonEntry extends BaseEntry {
  kind: 'person'
  vndb_staff_id?: string
  bangumi_person_id?: number
  language?: string
  links?: string[]
  aliases?: string[]
  // Bangumi person fields
  birthday?: string
  blood_type?: string
  reference_source?: string
  birthplace?: string
  office?: string
  x?: string
  spouse?: string
  official_website?: string
  blog?: string
}

export type CharMapValue = CharacterEntry | PersonEntry
