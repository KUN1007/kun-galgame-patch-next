export interface KunNavItem {
  name: string
  href: string
}

// NOTE: /tag, /company, /character, /person, /release 已按 D8/D11/D12 废弃，
// 这些元数据统一由 Galgame Wiki Service 托管（galgame.kungal.com）。
export const kunNavItem: KunNavItem[] = [
  { name: '下载', href: '/galgame' },
  { name: '发布', href: '/edit/create' },
  { name: '排行', href: '/ranking/user' },
  { name: '关于', href: '/about' }
]

export const kunNavItemDesktop: KunNavItem[] = [
  { name: '发布补丁', href: '/edit/create' },
  { name: '关于我们', href: '/about' }
]

export const kunMobileNavItem: KunNavItem[] = [
  ...kunNavItem,
  { name: '补丁评论列表', href: '/comment' },
  { name: '补丁资源列表', href: '/resource' },
  { name: '管理系统', href: '/admin' },
  { name: '联系我们', href: '/about/notice/feedback' }
]

export const KUN_CONTENT_LIMIT_MAP: Record<string, string> = {
  sfw: '仅显示 SFW (内容安全) 的内容',
  nsfw: '仅显示 NSFW (可能含有 R18) 的内容',
  all: '同时显示 SFW 和 NSFW 的内容'
}

export const KUN_CONTENT_LIMIT_LABEL: Record<string, string> = {
  '': '全年龄',
  sfw: '全年龄',
  nsfw: '涩涩模式',
  all: 'R18模式'
}

export interface KunTopBarCategoryItem {
  href: string
  label: string
  icon: string
}

export const kunTopBarCategories: KunTopBarCategoryItem[] = [
  { href: '/galgame', label: 'Galgame 列表', icon: 'lucide:gamepad-2' },
  { href: '/resource', label: '最新补丁列表', icon: 'lucide:puzzle' },
  { href: '/ranking', label: 'Galgame 排行', icon: 'lucide:chart-column-big' }
]
