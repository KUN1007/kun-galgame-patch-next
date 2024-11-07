import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface UserStore {
  uid: number
  name: string
  email: string
  avatar: string
  bio: string
  moemoepoint: number
}

interface UserState {
  user: UserStore
  setUser: (user: UserStore) => void
  logout: () => void
}

const initialUserStore: UserStore = {
  uid: 0,
  name: '',
  email: '',
  avatar: '',
  bio: '',
  moemoepoint: 0
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: initialUserStore,
      setUser: (user: UserStore) => set({ user }),
      logout: () => set({ user: initialUserStore })
    }),
    {
      name: 'kun-patch-user-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
