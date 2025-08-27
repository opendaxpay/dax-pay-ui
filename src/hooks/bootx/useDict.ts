import { useDictStore } from '@/store/modules/dict'
import { LabeledValue } from 'ant-design-vue/lib/select'
import { Dict } from '#/store'

const dictStore = useDictStore()

/**
 * 获取字典列表
 */
async function getDict(): Promise<Dict[]> {
  const dictList = dictStore.getDict
  if (dictList.length > 0) {
    return dictList
  } else {
    return await dictStore.initDict()
  }
}

/**
 * 字典项转换
 */
function dictConvert(dictCode: string, code:any) {
  const dictList = dictStore.getDict
  const item = dictList.filter((dict) => {
    return dictCode === dict.dictCode && dict.code === String(code)
  })
  if (item && item.length > 0) {
    return item[0].name
  } else {
    return ''
  }
}

/**
 * 获取字典下拉框数据列表
 */
async function dictDropDown(dictCode: string): Promise<LabeledValue[]> {
  const list = (await getDict()) || []
  return list
    .filter((dict) => dictCode === dict.dictCode)
    .map((o) => {
      return { label: o.name, value: o.code }
    })
}

/**
 * 字典hooks
 */
export function useDict() {
  // 初始化
  getDict().then()
  return {
    dictConvert,
    dictDropDown,
  }
}
