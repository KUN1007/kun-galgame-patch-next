export interface Char {
  id: number
  image: string
  gender: string
  role?: string
  roles: string[]
  name_zh_cn: string
  name_ja_jp: string
  name_en_us: string
}

export interface CharDetail extends Char {
  description_zh_cn: string
  description_ja_jp: string
  description_en_us: string
  birthday: string
  height: number
  weight: number
  bust: number
  waist: number
  hips: number
  cup: string
  age: number
  infobox: string
  alias: string[]
}
