import { defineStore } from 'pinia'

export interface CreatePatchData {
  name: KunLanguage
  introduction: KunLanguage
  vndbId: string
  alias: string[]
  released: string
  contentLimit: string
}

const initialState: CreatePatchData = {
  name: { 'zh-cn': '', 'ja-jp': '', 'en-us': '', 'zh-tw': '' },
  introduction: { 'zh-cn': '', 'ja-jp': '', 'en-us': '', 'zh-tw': '' },
  vndbId: '',
  alias: [],
  released: '',
  contentLimit: 'sfw'
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
