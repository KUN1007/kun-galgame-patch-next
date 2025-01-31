import { create } from 'zustand'

export interface MilkdownData {
  refreshContentStatus: boolean
}

interface StoreState {
  data: MilkdownData
  refreshMilkdownContent: () => void
}

const initialState: MilkdownData = {
  refreshContentStatus: false
}

export const useKunMilkdownStore = create<StoreState>()((set, get) => ({
  data: initialState,
  refreshMilkdownContent: () => {
    const currentStatus = get().data.refreshContentStatus
    set({ data: { refreshContentStatus: !currentStatus } })
  }
}))
