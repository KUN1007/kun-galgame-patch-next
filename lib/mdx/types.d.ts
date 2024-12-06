export interface KunPostMetadata {
  title: string
  banner: string
  date: string
  description: string
  slug: string
  path: string
}

export interface KunTreeNode {
  name: string
  path: string
  children?: KunTreeNode[]
  type: 'file' | 'directory'
}
