export interface KunPostMetadata {
  title: string
  date: string
  slug: string
  path: string
}

export interface KunTreeNode {
  name: string
  path: string
  children?: KunTreeNode[]
  type: 'file' | 'directory'
}
