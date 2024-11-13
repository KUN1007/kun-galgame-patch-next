import { create } from 'zustand'

export interface RewritePatchData {
  name: string
  introduction: string
  alias: string[]
  tags: string[]
}

export interface RewritePatchRequestData extends RewritePatchData {
  banner: Blob | null
}

interface StoreState {
  data: RewritePatchData
  getData: () => RewritePatchData
  setData: (data: RewritePatchData) => void
  resetData: () => void
}

const initialState: RewritePatchData = {
  name: '',
  introduction: '',
  alias: [],
  tags: []
}

export const useRewritePatchStore = create<StoreState>()((set, get) => ({
  data: initialState,
  getData: () => get().data,
  setData: (data: RewritePatchData) => set({ data }),
  resetData: () => set({ data: initialState })
}))
