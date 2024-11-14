import { create } from 'zustand'

export interface RewritePatchData {
  id: number
  banner: Blob | string
  name: string
  introduction: string
  alias: string[]
}

interface StoreState {
  data: RewritePatchData
  getData: () => RewritePatchData
  setData: (data: RewritePatchData) => void
  resetData: () => void
}

const initialState: RewritePatchData = {
  id: 0,
  banner: '',
  name: '',
  introduction: '',
  alias: []
}

export const useRewritePatchStore = create<StoreState>()((set, get) => ({
  data: initialState,
  getData: () => get().data,
  setData: (data: RewritePatchData) => set({ data }),
  resetData: () => set({ data: initialState })
}))
