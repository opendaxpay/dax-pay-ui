import type { DictItem } from '#/api/core/dict.api';

import { computed } from 'vue';

import { preferences } from '@vben/preferences';

import { useDictStore } from '#/store';

/**
 * 根据当前语言获取字典项显示名称
 * @param item 字典项
 * @returns 根据当前语言返回对应的名称
 */
function resolveDictLabel(item: DictItem): string {
  const locale = preferences.app.locale;
  return locale === 'en-US' ? item.nameEn! : item.nameCn!;
}

/**
 * 获取字典列表
 * 如果Store中已有数据则直接返回，否则从后端加载
 */
async function getDict(): Promise<DictItem[]> {
  const dictStore = useDictStore();
  const dictList = dictStore.getDict;
  if (dictList.length > 0) {
    return dictList;
  }
  return await dictStore.initDict();
}

/**
 * 字典项转换
 * @param dictCode 字典编码
 * @param code 字典项编码
 * @returns 根据当前语言返回对应的字典项名称
 */
function dictConvert(dictCode: string, code: null | number | string | undefined): string {
  const dictStore = useDictStore();
  const dictList = dictStore.getDict;
  const item = dictList.find((dict: DictItem) => dictCode === dict.dictCode && dict.code === String(code));
  if (item) {
    return resolveDictLabel(item);
  }
  return '';
}

/**
 * 获取字典下拉框数据列表
 * @param dictCode 字典编码
 * @returns 下拉框选项数组，label根据当前语言自动选择
 */
async function dictDropDown(dictCode: string): Promise<{ label: string; value: string | undefined }[]> {
  const list = (await getDict()) || [];
  return list
    .filter((dict) => dictCode === dict.dictCode)
    .map((o) => ({
      label: resolveDictLabel(o),
      value: o.code,
    }));
}

/**
 * 字典hooks
 * 提供字典翻译和下拉框功能，支持中英文国际化
 * @param dictCode 字典编码，传入时额外返回 dictItems 响应式列表
 */
export function useDict(dictCode?: string) {
  getDict().then();
  const dictStore = useDictStore();

  const dictItems = computed(() => {
    const list = dictStore.getDict;
    return list
      .filter((dict: DictItem) => dictCode === dict.dictCode)
      .filter((item: DictItem) => item.code !== undefined)
      .map((item: DictItem) => ({
        label: resolveDictLabel(item),
        value: item.code!,
      }));
  });

  return {
    dictConvert,
    dictDropDown,
    dictItems,
  };
}
