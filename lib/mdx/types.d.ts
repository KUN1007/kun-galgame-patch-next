export interface PostMetadata {
  title: string
  date: string
  slug: string
  path: string
}

export interface TreeNode {
  name: string
  path: string
  children?: TreeNode[]
  type: 'file' | 'directory'
}
