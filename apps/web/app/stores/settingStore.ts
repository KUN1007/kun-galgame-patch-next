import { defineStore } from 'pinia'

export interface KunSettingData {
  kunNsfwEnable: string
}

const initialState: KunSettingData = {
  kunNsfwEnable: 'sfw'
}

export const useSettingStore = defineStore('setting', {
  state: (): { data: KunSettingData } => ({
    data: { ...initialState }
  }),
  actions: {
    setData(data: Partial<KunSettingData>) {
      this.data = { ...this.data, ...data }
    },
    resetData() {
      this.data = { ...initialState }
    }
  },
  persist: {
    key: 'kun-patch-setting-store'
  }
})
