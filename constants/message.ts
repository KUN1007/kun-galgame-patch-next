export const MESSAGE_TYPE = [
  'apply',
  'pm',
  'likeResource',
  'likeComment',
  'favorite',
  'comment',
  'follow',
  'pr',
  'mention',
  'patchResourceCreate',
  'patchResourceUpdate',
  'system',
  ''
] as const

export const MESSAGE_TYPE_MAP: Record<string, string> = {
  apply: '申请',
  pm: '私聊',
  likeResource: '点赞资源',
  likeComment: '点赞评论',
  favorite: '收藏',
  comment: '评论',
  follow: '关注',
  pr: '更新请求',
  mention: '提到了您',
  patchResourceCreate: '创建新补丁',
  patchResourceUpdate: '更新补丁',
  system: '系统'
}
