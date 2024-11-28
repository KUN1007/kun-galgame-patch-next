export const getUserRole = (role: number) => {
  if (role === 2) {
    return '创作者'
  } else if (role === 3) {
    return '管理员'
  } else if (role === 4) {
    return '超级管理员'
  } else {
    return '用户'
  }
}

export const getUserStatus = (status: number) => {
  if (status === 0) {
    return '正常'
  } else if (status === 1) {
    return '限制'
  } else {
    return '封禁'
  }
}

export const getUserStatusColor = (status: number) => {
  if (status === 0) {
    return 'success'
  } else if (status === 1) {
    return 'warning'
  } else {
    return 'danger'
  }
}
