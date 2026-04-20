export const USER_ROLE_MAP: Record<number, string> = {
  1: '用户',
  2: '创作者',
  3: '管理员',
  4: '超级管理员'
}

export const USER_STATUS_MAP: Record<number, string> = {
  0: '正常',
  1: '限制（正在开发中）',
  2: '封禁'
}

export const USER_STATUS_COLOR_MAP: Record<
  number,
  'success' | 'warning' | 'danger'
> = {
  0: 'success',
  1: 'warning',
  2: 'danger'
}
