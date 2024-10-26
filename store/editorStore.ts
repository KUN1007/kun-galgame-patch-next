import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface CrepeAPI {
  loaded: boolean
  onShare: () => void
  update: (markdown: string) => void
}

type FocusType = 'crepe' | null

interface StoreState {
  markdown: string
  crepeAPI: CrepeAPI
  focus: FocusType
  setMarkdown: (markdown: string) => void
  setCrepeAPI: (api: CrepeAPI) => void
  setFocus: (focus: FocusType) => void
}

export const useEditorStore = create<StoreState>()(
  persist(
    (set) => ({
      markdown: '',
      crepeAPI: {
        loaded: false,
        onShare: () => {},
        update: (markdown: string) =>
          set((state) => ({
            crepeAPI: {
              ...state.crepeAPI,
              loaded: true,
              update: () => markdown
            }
          }))
      },
      focus: null,
      setMarkdown: (markdown: string) => set({ markdown }),
      setCrepeAPI: (api: CrepeAPI) => set({ crepeAPI: api }),
      setFocus: (focus: FocusType) => set({ focus })
    }),
    {
      name: 'kun-patch-editor-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
