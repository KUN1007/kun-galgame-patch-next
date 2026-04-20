interface KunPostMetadata {
  title: string
  banner: string
  date: string
  description: string
  textCount: number
  slug: string
  path: string
  directory: string
}

interface KunPostFrontmatter {
  title: string
  banner: string
  description: string
  date: string
  authorUid?: number
  authorName: string
  authorAvatar: string
  authorHomepage?: string
}

interface KunPostDetail {
  slug: string
  html: string
  frontmatter: KunPostFrontmatter
  prev: KunPostMetadata | null
  next: KunPostMetadata | null
}

interface KunTreeNode {
  name: string
  label: string
  path: string
  children?: KunTreeNode[]
  type: 'file' | 'directory'
}
