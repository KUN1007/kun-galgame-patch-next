import { defineStore } from 'pinia'

export interface UserState {
  uid: number
  name: string
  avatar: string
  bio: string
  moemoepoint: number
  role: number

  dailyCheckIn: number
  dailyImageLimit: number
  dailyUploadLimit: number

  mutedMessageTypes: string[]
}

const initialUserState: UserState = {
  uid: 0,
  name: '',
  avatar: '',
  bio: '',
  moemoepoint: 0,
  role: 1,
  dailyCheckIn: 1,
  dailyImageLimit: 0,
  dailyUploadLimit: 0,
  mutedMessageTypes: []
}

export const useUserStore = defineStore('user', {
  state: (): { user: UserState } => ({
    user: { ...initialUserState }
  }),
  actions: {
    setUser(user: UserState) {
      this.user = {
        ...user,
        mutedMessageTypes: this.user.mutedMessageTypes
      }
    },
    toggleMutedMessageType(type: string) {
      const muted = this.user.mutedMessageTypes
      this.user.mutedMessageTypes = muted.includes(type)
        ? muted.filter((t) => t !== type)
        : [...muted, type]
    },
    logout() {
      this.user = {
        ...initialUserState,
        mutedMessageTypes: this.user.mutedMessageTypes
      }
    }
  },
  getters: {
    isLoggedIn: (state) => state.user.uid > 0 && !!state.user.name,
    isAdmin: (state) => state.user.role >= 3
  },
  persist: {
    key: 'kun-patch-user-store',
    storage: piniaPluginPersistedstate.localStorage()
  }
})
