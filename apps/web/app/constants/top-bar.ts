import type { KunNsfwPreference } from '~/stores/settingStore'

export interface KunNavItem {
  name: string
  href: string
}

// NOTE: /tag, /company, /character, /person, /release are deprecated per D8/D11/D12.
// Their metadata is owned by the NextMoe catalog service (reached through the
// moyu backend's galgame client), not a standalone wiki site.
export const kunNavItem: KunNavItem[] = [
  { name: '下载', href: '/galgame' },
  { name: '资料库', href: '/gallib' },
  { name: '发布', href: '/edit/create' },
  { name: '排行', href: '/ranking/user' },
  { name: '关于', href: '/doc' }
]

export const kunNavItemDesktop: KunNavItem[] = [
  { name: '发售月表', href: '/calendar' },
  { name: '发布补丁', href: '/edit/create' },
  { name: '关于我们', href: '/doc' }
]

// Public mobile nav entries (visible to everyone). The admin entry is
// rendered separately, gated on userStore.isAdmin in MobileMenu.vue, so
// non-admins don't see (and can't 403 on) it.
export const kunMobileNavItem: KunNavItem[] = [
  ...kunNavItem,
  { name: '发售月表', href: '/calendar' },
  { name: '补丁评论列表', href: '/comment' },
  { name: '补丁资源列表', href: '/resource' },
  { name: '联系我们', href: '/doc/notice/feedback' }
]

// Admin-only entries. Filter into the rendered list at the call site.
export const kunMobileAdminItem: KunNavItem[] = [
  { name: '管理系统', href: '/admin' }
]

export const KUN_CONTENT_LIMIT_MAP: Record<string, string> = {
  sfw: '仅显示 SFW (内容安全) 的内容',
  all: '同时显示 SFW 和 NSFW 的内容'
}

export const KUN_CONTENT_LIMIT_LABEL: Record<string, string> = {
  '': '全年龄',
  sfw: '全年龄',
  all: 'R18模式'
}

// The three surfaces that offer the switch (top bar, mobile menu, settings)
// each kept their own copy of this list and had drifted in order, so dropping
// the NSFW-only mode meant editing the same array three times.
export const KUN_CONTENT_LIMIT_OPTIONS = [
  { key: 'sfw', icon: 'lucide:shield-check' },
  { key: 'all', icon: 'lucide:circle-slash' }
] as const satisfies ReadonlyArray<{ key: KunNsfwPreference; icon: string }>

// Radio-shaped view of the switch above, for the surfaces that render it as a
// pill group (mobile menu, 系统设置) rather than a button list.
export const KUN_CONTENT_LIMIT_RADIO_OPTIONS = KUN_CONTENT_LIMIT_OPTIONS.map(
  (opt) => ({
    value: opt.key,
    label: KUN_CONTENT_LIMIT_LABEL[opt.key] ?? opt.key,
    icon: opt.icon
  })
)

export type KunThemePreference = 'light' | 'dark' | 'system'

// Same reason as the content-limit list: the mobile menu and 系统设置 each had
// their own copy, and the labels had already drifted (浅色 vs 浅色主题).
export const KUN_THEME_OPTIONS = [
  { value: 'light', label: '浅色', icon: 'lucide:sun' },
  { value: 'dark', label: '深色', icon: 'lucide:moon' },
  { value: 'system', label: '跟随系统', icon: 'lucide:sun-moon' }
] as const satisfies ReadonlyArray<{
  value: KunThemePreference
  label: string
  icon: string
}>

export interface KunTopBarCategoryItem {
  href: string
  label: string
  icon: string
}

export const kunTopBarCategories: KunTopBarCategoryItem[] = [
  { href: '/galgame', label: 'Galgame 补丁资源库', icon: 'lucide:gamepad-2' },
  { href: '/gallib', label: 'Galgame 信息资料库', icon: 'lucide:library-big' },
  { href: '/resource', label: '最新补丁列表', icon: 'lucide:puzzle' },
  { href: '/ranking', label: 'Galgame 排行', icon: 'lucide:chart-column-big' }
]
