import { defineStore } from 'pinia'

// Mirrors GET /api/v1/auth/me (and /oauth/callback) MeResponse. Keys are
// snake_case to match the wire format verbatim; no client-side remapping.
export interface UserState {
  uid: number
  name: string
  avatar: string
  bio: string
  moemoepoint: number
  role: number

  daily_check_in: number
  daily_image_count: number
  daily_upload_size: number

  muted_message_types: string[]
}

const initialUserState: UserState = {
  uid: 0,
  name: '',
  avatar: '',
  bio: '',
  moemoepoint: 0,
  role: 1,
  daily_check_in: 1,
  daily_image_count: 0,
  daily_upload_size: 0,
  muted_message_types: []
}

export const useUserStore = defineStore('user', {
  state: (): { user: UserState } => ({
    user: { ...initialUserState }
  }),
  actions: {
    setUser(user: Partial<UserState>) {
      this.user = {
        ...this.user,
        ...user,
        muted_message_types: this.user.muted_message_types
      }
    },
    toggleMutedMessageType(type: string) {
      const muted = this.user.muted_message_types
      this.user.muted_message_types = muted.includes(type)
        ? muted.filter((t) => t !== type)
        : [...muted, type]
    },
    logout() {
      this.user = {
        ...initialUserState,
        muted_message_types: this.user.muted_message_types
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
