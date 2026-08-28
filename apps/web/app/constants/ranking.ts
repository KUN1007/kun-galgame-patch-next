// The two ranking pages are separate routes rather than one page with a toggle,
// so each renders the same nav with its own value pinned.
export const KUN_RANKING_TABS = [
  {
    value: 'user',
    textValue: '用户排名',
    icon: 'lucide:user',
    href: '/ranking/user'
  },
  {
    value: 'patch',
    textValue: '补丁排名',
    icon: 'lucide:puzzle',
    href: '/ranking/patch'
  }
]

export const KUN_RANKING_LIMIT = 60
