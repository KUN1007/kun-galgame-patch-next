import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PatchFormData {
  name: string
  introduction: string
  vndbId: string
  alias: string[]
  released: string
}

export interface PatchFormRequestData extends PatchFormData {
  banner: Blob | null
}

interface StoreState {
  data: PatchFormData
  getData: () => PatchFormData
  setData: (data: PatchFormData) => void
  resetData: () => void
}

const initialState: PatchFormData = {
  name: '',
  introduction: '',
  vndbId: '',
  alias: [],
  released: ''
}

export const useEditStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: initialState,
      getData: () => get().data,
      setData: (data: PatchFormData) => set({ data }),
      resetData: () => set({ data: initialState })
    }),
    {
      name: 'kun-patch-edit-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
