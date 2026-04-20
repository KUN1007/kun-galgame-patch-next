interface Company {
  id: number
  name: string
  logo: string
  count: number
  alias: string[]
}

interface CompanyDetail extends Company {
  introduction: string
  primary_language: string[]
  official_website: string[]
  parent_brand: string[]
  created: string | Date
}
