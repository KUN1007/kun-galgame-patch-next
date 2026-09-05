import { defineStore } from 'pinia'

const HISTORY_MAX = 20

// localStorage, not the cookie the other two stores use: search history is
// never read during SSR and would otherwise ride along on every request to the
// API. Anything that renders it must sit behind <ClientOnly>, since the server
// has no way to know what is in it.
export const useSearchStore = defineStore('kun-patch-search', {
  state: () => ({
    history: [] as string[]
  }),

  actions: {
    remember(value: string) {
      const keyword = value.trim()
      if (!keyword) {
        return
      }
      // Replace-array rather than push/splice so pinia tracks the mutation and
      // the persist plugin writes it.
      this.history = [
        ...this.history.filter((item) => item !== keyword),
        keyword
      ].slice(-HISTORY_MAX)
    },

    forget(value: string) {
      this.history = this.history.filter((item) => item !== value)
    },

    clear() {
      this.history = []
    }
  },

  persist: {
    key: 'kun-patch-search-history',
    storage: piniaPluginPersistedstate.localStorage()
  }
})
