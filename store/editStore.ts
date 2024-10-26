import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PatchFormData {
  name: string
  vndbId: string
  alias: string[]
}

interface StoreState {
  data: PatchFormData
  setData: (data: PatchFormData) => void
  resetData: () => void
}

const initialState: PatchFormData = {
  name: '',
  vndbId: '',
  alias: []
}

export const useEditStore = create<StoreState>()(
  persist(
    (set) => ({
      data: initialState,
      setData: (data: PatchFormData) => set({ data }),
      resetData: () => set({ data: initialState })
    }),
    {
      name: 'kun-patch-edit-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
