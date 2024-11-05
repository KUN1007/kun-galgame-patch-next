import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { cookieStorage } from './_cookie'

export interface UserStore {
  uid: number
  name: string
  email: string
  avatar: string
  moemoepoint: number
}

interface UserState {
  user: UserStore
  login: (user: UserStore) => void
  logout: () => void
}

const initialUserStore: UserStore = {
  uid: 0,
  name: '',
  email: '',
  avatar: '',
  moemoepoint: 0
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUserStore,
      login: (user: UserStore) => set({ user }),
      logout: () => set({ user: initialUserStore })
    }),
    {
      name: 'kun-patch-user-store',
      storage: createJSONStorage(() => cookieStorage)
    }
  )
)
