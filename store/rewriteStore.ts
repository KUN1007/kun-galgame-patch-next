import { create } from 'zustand'

export interface RewritePatchData {
  id: number
  vndbId: string
  name: string
  introduction: string
  alias: string[]
  released: string
}

interface StoreState {
  data: RewritePatchData
  getData: () => RewritePatchData
  setData: (data: RewritePatchData) => void
  resetData: () => void
}

const initialState: RewritePatchData = {
  id: 0,
  vndbId: '',
  name: '',
  introduction: '',
  alias: [],
  released: ''
}

export const useRewritePatchStore = create<StoreState>()((set, get) => ({
  data: initialState,
  getData: () => get().data,
  setData: (data: RewritePatchData) => set({ data }),
  resetData: () => set({ data: initialState })
}))
