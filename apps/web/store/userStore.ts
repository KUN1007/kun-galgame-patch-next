import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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

export interface UserStore {
  user: UserState
  setUser: (user: UserState) => void
  toggleMutedMessageType: (type: string) => void
  logout: () => void
}

const initialUserStore: UserState = {
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

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: initialUserStore,
      setUser: (user: UserState) =>
        set((state) => ({
          user: {
            ...user,
            mutedMessageTypes: state.user.mutedMessageTypes
          }
        })),
      toggleMutedMessageType: (type: string) =>
        set((state) => ({
          user: {
            ...state.user,
            mutedMessageTypes: state.user.mutedMessageTypes.includes(type)
              ? state.user.mutedMessageTypes.filter((t) => t !== type)
              : [...state.user.mutedMessageTypes, type]
          }
        })),
      logout: () =>
        set((state) => ({
          user: {
            ...initialUserStore,
            mutedMessageTypes: state.user.mutedMessageTypes
          }
        }))
    }),
    {
      name: 'kun-patch-user-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
