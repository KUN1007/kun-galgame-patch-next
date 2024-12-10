export interface KunNavItem {
  name: string
  href: string
}

export const kunNavItem: KunNavItem[] = [
  {
    name: '补丁下载',
    href: '/galgame'
  },
  {
    name: '发布补丁',
    href: '/edit/create'
  },
  {
    name: '补丁标签',
    href: '/tag'
  },
  {
    name: '关于我们',
    href: '/about'
  }
]

export const kunMobileNavItem: KunNavItem[] = [
  ...kunNavItem,
  {
    name: '补丁评论列表',
    href: '/comment'
  },
  {
    name: '补丁资源列表',
    href: '/resource'
  },
  {
    name: '管理系统',
    href: '/admin'
  }
]
