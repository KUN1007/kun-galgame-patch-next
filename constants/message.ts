export const MESSAGE_TYPE = [
  'apply',
  'system',
  'pm',
  'like',
  'favorite',
  'comment',
  'follow',
  'pr'
] as const

export const MESSAGE_TYPE_MAP: Record<string, string> = {
  apply: '申请',
  system: '系统',
  pm: '私聊',
  like: '点赞',
  favorite: '收藏',
  comment: '评论',
  follow: '关注',
  pr: '更新请求'
}
