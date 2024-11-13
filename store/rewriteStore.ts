import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PatchFormData {
  name: string
  introduction: string
  vndbId: string
  alias: string[]
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
  alias: []
}

export const useRewriteStore = create<StoreState>()((set, get) => ({
  data: initialState,
  getData: () => get().data,
  setData: (data: PatchFormData) => set({ data }),
  resetData: () => set({ data: initialState })
}))
