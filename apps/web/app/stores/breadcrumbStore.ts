import { defineStore } from 'pinia'
import type { KunBreadcrumbItem } from '~/constants/routes/constants'

export const initialItems: KunBreadcrumbItem[] = [
  { key: '/resource', label: '资源下载', href: '/resource' },
  { key: '/galgame', label: 'Galgame', href: '/galgame' },
  { key: '/comment', label: '评论', href: '/comment' },
  { key: '/', label: '主页', href: '/' }
]

export const useBreadcrumbStore = defineStore('breadcrumb', {
  state: (): { items: KunBreadcrumbItem[] } => ({
    items: [...initialItems]
  }),
  actions: {
    setItems(items: KunBreadcrumbItem[]) {
      this.items = items
    },
    addItem(item: KunBreadcrumbItem) {
      this.items.push(item)
    },
    removeItem(key: string) {
      this.items = this.items.filter((i) => i.key !== key)
    },
    clearItems() {
      this.items = []
    }
  },
  persist: {
    key: 'kun-patch-breadcrumb-store',
    storage: piniaPluginPersistedstate.localStorage()
  }
})
