import type { OverviewData } from '~/types/api/admin'

export const APPLICANT_STATUS_MAP: Record<number, string> = {
  0: '待处理',
  1: '已处理',
  2: '已同意',
  3: '已拒绝'
}

export const ADMIN_LOG_TYPE_MAP: Record<string, string> = {
  create: '创建',
  delete: '删除',
  approve: '同意',
  decline: '拒绝',
  update: '更改'
}

export const ADMIN_STATS_SUM_MAP: Record<string, string> = {
  userCount: '用户总数',
  galgameCount: 'Galgame 总数',
  patchResourceCount: 'Galgame 补丁总数',
  patchCommentCount: '评论总数'
}

export const ADMIN_STATS_MAP: Record<keyof OverviewData, string> = {
  newUser: '新注册用户',
  newActiveUser: '新活跃用户',
  newGalgame: '新发布 Galgame',
  newPatchResource: '新发布补丁',
  newComment: '新发布评论'
}
