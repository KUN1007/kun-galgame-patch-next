import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface PatchCommentData {
  content: string
}

interface StoreState {
  data: PatchCommentData
  getData: () => PatchCommentData
  setData: (data: PatchCommentData) => void
  resetData: () => void
}

const initialState: PatchCommentData = {
  content: ''
}

export const usePatchCommentStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: initialState,
      getData: () => get().data,
      setData: (data: PatchCommentData) => set({ data }),
      resetData: () => set({ data: initialState })
    }),
    {
      name: 'kun-patch-comment-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
