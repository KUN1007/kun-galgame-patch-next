export interface KunNavItem {
  name: string
  href: string
}

export const kunNavItem: KunNavItem[] = [
  {
    name: '下载',
    href: '/galgame'
  },
  {
    name: '发布',
    href: '/edit/create'
  },
  {
    name: '标签',
    href: '/tag'
  },
  {
    name: '会社',
    href: '/company'
  },
  {
    name: '新作',
    href: '/release'
  },
  {
    name: '排行',
    href: '/ranking/user'
  },
  {
    name: '关于',
    href: '/about'
  }
]

export const kunNavItemDesktop: KunNavItem[] = [
  {
    name: '发布补丁',
    href: '/edit/create'
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
  },
  {
    name: '联系我们',
    href: '/about/notice/feedback'
  }
]
