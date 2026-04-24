import { defineStore } from 'pinia'

// D12 (2026-04-21): galgame metadata (name / introduction / banner / released /
// content_limit / alias) is owned by the Galgame Wiki. Publishing a patch only needs vndb_id.
export interface CreatePatchData {
  vndbId: string
}

const initialState: CreatePatchData = {
  vndbId: ''
}

export const useCreatePatchStore = defineStore('edit-create-patch', {
  state: (): { data: CreatePatchData } => ({
    data: { ...initialState }
  }),
  actions: {
    setData(data: Partial<CreatePatchData>) {
      this.data = { ...this.data, ...data }
    },
    resetData() {
      this.data = JSON.parse(JSON.stringify(initialState))
    }
  },
  persist: {
    key: 'kun-patch-edit-store-v2',
    storage: piniaPluginPersistedstate.localStorage()
  }
})
