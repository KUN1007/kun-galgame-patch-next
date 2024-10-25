import { create } from 'zustand'

interface CrepeAPI {
  loaded: boolean
  onShare: () => void
  update: (markdown: string) => void
}

interface CMAPI {
  loaded: boolean
  update: (markdown: string) => void
}

type FocusType = 'crepe' | 'cm' | null

interface StoreState {
  markdown: string
  crepeAPI: CrepeAPI
  cmAPI: CMAPI
  focus: FocusType
  setMarkdown: (markdown: string) => void
  setCrepeAPI: (api: CrepeAPI) => void
  setCMAPI: (api: CMAPI) => void
  setFocus: (focus: FocusType) => void
}

export const useStore = create<StoreState>((set) => ({
  markdown: '',
  crepeAPI: {
    loaded: false,
    onShare: () => {},
    update: (markdown: string) =>
      set((state) => ({
        crepeAPI: { ...state.crepeAPI, loaded: true, update: () => markdown }
      }))
  },
  cmAPI: {
    loaded: false,
    update: (markdown: string) =>
      set((state) => ({
        cmAPI: { ...state.cmAPI, loaded: true, update: () => markdown }
      }))
  },
  focus: null,
  setMarkdown: (markdown: string) => set({ markdown }),
  setCrepeAPI: (api: CrepeAPI) => set({ crepeAPI: api }),
  setCMAPI: (api: CMAPI) => set({ cmAPI: api }),
  setFocus: (focus: FocusType) => set({ focus })
}))
