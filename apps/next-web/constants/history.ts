export const HISTORY_ACTION_TYPE = [
  'create',
  'update',
  'delete',
  'merge',
  'decline'
] as const

export const HISTORY_ACTION_TYPE_MAP: Record<string, string> = {
  create: '创建了',
  update: '更新了',
  delete: '删除了',
  merge: '合并了',
  decline: '拒绝了'
}

export const HISTORY_TYPE = [
  'galgame',
  'introduction',
  'tag',
  'pr',
  'banner'
] as const

export const HISTORY_TYPE_MAP: Record<string, string> = {
  galgame: 'Galgame',
  tag: 'Galgame 标签',
  pr: '更新请求',
  banner: '预览图'
}
