import { defineStore } from 'pinia'
import { findAllByEnable } from '@/views/baseapi/dict/DictItem.api'
import { Dict } from '#/store'

interface DictState {
  dict: Dict[]
}
export const useDictStore = defineStore({
  id: 'app-dict',
  state: (): DictState => ({
    dict: [],
  }),
  getters: {
    getDict(): Dict[] {
      //  获取字典
      return this.dict
    },
  },
  actions: {
    /**
     * 初始化字典, 并返回字典列表
     */
    async initDict() {
      const { data } = await findAllByEnable()
      this.dict = data.map((o) => {
        return {
          dictCode: o.dictCode,
          code: o.code,
          name: o.name,
        } as Dict
      })
      console.log('初始化字典')
      return this.dict
    },
  },
})
