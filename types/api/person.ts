export interface PatchPerson {
  id: number
  image: string
  roles: string[]
  name: KunLanguage
}

export interface PatchPersonDetail extends PatchPerson {
  description: KunLanguage
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
