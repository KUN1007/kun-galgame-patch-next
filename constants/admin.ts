export const APPLICANT_STATUS_MAP: Record<number, string> = {
  0: '待处理',
  1: '已处理',
  2: '已同意',
  3: '已拒绝'
}

export const ADMIN_LOG_TYPE_MAP: Record<string, string> = {
  create: '创建了',
  delete: '删除了',
  approve: '同意了',
  decline: '拒绝了',
  update: '更改了'
}
