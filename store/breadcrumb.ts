import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { KunBreadcrumbItem } from '~/constants/routes'

type BreadcrumbStore = {
  items: KunBreadcrumbItem[]
  setItems: (items: KunBreadcrumbItem[]) => void
  addItem: (item: KunBreadcrumbItem) => void
  removeItem: (key: string) => void
  clearItems: () => void
}

export const initialItem: KunBreadcrumbItem[] = [
  {
    key: '/resource',
    label: '资源下载',
    href: '/resource'
  },
  {
    key: '/galgame',
    label: 'Galgame',
    href: '/galgame'
  },
  {
    key: '/comment',
    label: '评论',
    href: '/comment'
  },
  {
    key: '/',
    label: '主页',
    href: '/'
  }
]

export const useBreadcrumbStore = create<BreadcrumbStore>()(
  persist(
    (set) => ({
      items: initialItem,
      setItems: (items) => set({ items }),
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item]
        })),
      removeItem: (key) =>
        set((state) => ({
          items: state.items.filter((item) => item.key !== key)
        })),
      clearItems: () => set({ items: [] })
    }),
    {
      name: 'kun-patch-breadcrumb-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
