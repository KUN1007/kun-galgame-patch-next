export interface BreadcrumbItemType {
  key: string
  label: string
  href: string
  icon?: string
}

const keyLabelMap: Record<string, string> = {
  '/': '主页',
  '/about': '关于我们',
  '/admin/comment': '评论管理',
  '/admin/creator': '创作者管理',
  '/admin/galgame': 'Galgame 管理',
  '/admin/log': '管理日志',
  '/admin': '管理页面',
  '/admin/resource': '补丁资源管理',
  '/admin/setting': '管理系统设置',
  '/admin/user': '用户管理',
  '/apply': '创作者申请',
  '/apply/pending': '正在申请中',
  '/apply/success': '申请成功',
  '/auth/forgot': '忘记密码',
  '/comment': '评论',
  '/edit/create': '创建补丁',
  '/galgame': 'Galgame',
  '/login': '登录',
  '/message/follow': '关注消息',
  '/message/notice': '通知消息',
  '/message/system': '系统消息',
  '/patch/[id]/comment': '补丁评论',
  '/patch/[id]/history': '补丁历史',
  '/patch/[id]/introduction': '补丁介绍',
  '/patch/[id]/pr': '补丁更新请求',
  '/patch/[id]/resource': '补丁资源',
  '/register': '注册',
  '/resource': '资源下载',
  '/search': '搜索',
  '/settings/user': '用户设置',
  '/tag': '补丁标签',
  '/tag/[id]': '标签详情',
  '/user/[id]/comment': '用户评论',
  '/user/[id]/contribute': '用户贡献',
  '/user/[id]/favorite': '用户收藏',
  '/user/[id]/galgame': '用户 Galgame',
  '/user/[id]/resource': '用户资源'
}

export const getPathLabel = (pathname: string): string => {
  for (const key in keyLabelMap) {
    const regex = new RegExp(`^${key.replace(/\[id\]/g, '\\d+')}$`)
    if (regex.test(pathname)) {
      return keyLabelMap[key]
    }
  }

  return keyLabelMap[pathname]
}
