import { defineStore } from 'pinia'
import { FilePlatform } from '#/store'
import { findAll, getDefaultUploadPlatform } from '@/views/baseapi/file/platform/FilePlatform.api'

interface FilePlatformState {
  filePlatform: FilePlatform[]
  uploadPlatform: string
}
export const useFilePlatformStore = defineStore({
  id: 'app-file-platform',
  state: (): FilePlatformState => ({
    filePlatform: [],
    uploadPlatform: '',
  }),
  getters: {
    getFilePlatforms(): FilePlatform[] {
      return this.filePlatform
    },
    getUploadPlatform(): string {
      return this.uploadPlatform
    },
  },
  actions: {
    /**
     * 初始化存储平台列表
     */
    async initFilePlatform() {
      const { data } = await findAll()
      // 初始化列表
      this.filePlatform = data.map((o) => {
        return {
          type: o.type,
          url: o.url,
          defaultPlatform: o.defaultPlatform,
          frontendUpload: o.frontendUpload,
        } as FilePlatform
      })
      console.log('初始化存储平台')
      return this.filePlatform
    },

    /**
     * 获取默认上传平台
     */
    async initUploadPlatform() {
      const { data } = await getDefaultUploadPlatform()
      this.uploadPlatform = data
      console.log(`默认上传存储平台为: ${this.uploadPlatform}`)
      return data
    },
  },
})
