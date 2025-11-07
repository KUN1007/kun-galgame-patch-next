export interface Person {
  id: number
  image: string
  roles: string[]
  name_zh_cn: string
  name_ja_jp: string
  name_en_us: string
}

export interface PersonDetail extends Person {
  description_zh_cn: string
  description_ja_jp: string
  description_en_us: string
  birthday: string
  blood_type: string
  birthplace: string
  office: string
  x: string
  spouse: string
  official_website: string
  blog: string
  alias: string[]
  patches: {
    id: number
    name: string
    banner: string
  }[]
}
