interface Tag {
  id: number
  name: string
  count: number
  alias: string[]
}

interface TagDetail extends Tag {
  introduction: string
  created: string | Date
}
