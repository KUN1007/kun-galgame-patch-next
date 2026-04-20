export interface PatchCharacter {
  id: number
  image: string
  gender: string
  role?: string
  roles: string[]
  name: KunLanguage
}

export interface PatchCharacterDetail extends PatchCharacter {
  description: KunLanguage
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
  patches: {
    id: number
    name: KunLanguage
    banner: string
  }[]
}
