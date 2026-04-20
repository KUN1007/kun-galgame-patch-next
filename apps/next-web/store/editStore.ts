import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface CreatePatchData {
  name: KunLanguage
  introduction: KunLanguage
  vndbId: string
  alias: string[]
  released: string
  contentLimit: string
}

export interface CreatePatchRequestData extends CreatePatchData {
  banner: Blob | null
}

interface StoreState {
  data: CreatePatchData
  getData: () => CreatePatchData
  setData: (data: CreatePatchData) => void
  resetData: () => void
}

const initialState: CreatePatchData = {
  name: {
    'zh-cn': '',
    'ja-jp': '',
    'en-us': ''
  },
  introduction: {
    'zh-cn': '',
    'ja-jp': '',
    'en-us': ''
  },
  vndbId: '',
  alias: [],
  released: '',
  contentLimit: 'sfw'
}

export const useCreatePatchStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: initialState,
      getData: () => get().data,
      setData: (data: CreatePatchData) => set({ data }),
      resetData: () => set({ data: initialState })
    }),
    {
      name: 'kun-patch-edit-store-v2',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
