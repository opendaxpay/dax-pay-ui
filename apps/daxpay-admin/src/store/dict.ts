import { defineStore } from 'pinia';

import { DictCommonApi, type DictItem } from '#/api/core/dict.api';

/** 字典Store状态 */
interface DictState {
  /** 字典列表 */
  dict: DictItem[];
}

/**
 * 字典Store
 */
export const useDictStore = defineStore('app-dict', {
  state: (): DictState => ({
    dict: [],
  }),
  getters: {
    /** 获取字典列表 */
    getDict: (state) => state.dict,
  },
  actions: {
    /**
     * 初始化字典数据
     */
    async initDict(): Promise<DictItem[]> {
      const { data } = await DictCommonApi.findAllByEnable();
      this.dict = data.map((o: DictItem) => ({
        dictCode: o.dictCode,
        code: o.code,
        nameCn: o.nameCn,
        nameEn: o.nameEn,
      }));
      return this.dict;
    },
  },
});
