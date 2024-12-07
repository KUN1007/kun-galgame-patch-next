export interface KunPostMetadata {
  title: string
  banner: string
  date: string
  description: string
  textCount: number
  slug: string
  path: string
}

export interface KunTreeNode {
  name: string
  path: string
  children?: KunTreeNode[]
  type: 'file' | 'directory'
}

export interface KunFrontmatter {
  title: string
  banner: string
  description: string
  date: string
  authorName: string
  authorAvatar: string
  authorHomepage: string
}

export interface KunBlog {
  slug: string
  content: string
  frontmatter: KunFrontmatter
}
