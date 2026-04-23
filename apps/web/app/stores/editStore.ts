import { defineStore } from 'pinia'

// D12（2026-04-21）：游戏元数据（name / introduction / banner / released /
// content_limit / alias）由 Galgame Wiki 统一维护。发布补丁只需 vndb_id。
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
