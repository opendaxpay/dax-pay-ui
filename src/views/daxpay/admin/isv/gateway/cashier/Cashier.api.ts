import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'

/**
 * 获取分组配置列表
 */
export function getGroupConfigs(cashierType) {
  return defHttp.get<Result<CashierGroupConfig[]>>({
    url: '/isv/cashier/config/listByType',
    params: {
      cashierType,
    },
  })
}
/**
 * 获取分组配置列表
 */
export function getGroupConfig(id) {
  return defHttp.get<Result<CashierGroupConfig>>({
    url: '/isv/cashier/config/findGroupById',
    params: { groupId: id },
  })
}

/**
 * 保存分组配置
 */
export function saveGroupConfig(data: CashierGroupConfig) {
  return defHttp.post<Result<CashierGroupConfig>>({
    url: '/isv/cashier/config/saveGroup',
    data,
  })
}

/**
 * 创建默认分组(h5)
 */
export function saveDefaultGroup() {
  return defHttp.post<Result<CashierGroupConfig>>({
    url: '/isv/cashier/config/saveDefaultGroup',
  })
}

/**
 * 更新分组配置
 */
export function updateGroupConfig(data: CashierGroupConfig) {
  return defHttp.post<Result<CashierGroupConfig>>({
    url: '/isv/cashier/config/updateGroup',
    data,
  })
}

/**
 * 删除分组配置
 */
export function delGroupConfig(id) {
  return defHttp.post({
    url: '/isv/cashier/config/deleteGroup',
    params: { id },
  })
}

/**
 * 获取配置项配置列表
 */
export function getItemConfigs(groupId) {
  return defHttp.get<Result<CashierItemConfig[]>>({
    url: '/isv/cashier/config/listByItem',
    params: {
      groupId,
    },
  })
}
/**
 * 获取配置项配置
 */
export function getItemConfig(groupId) {
  return defHttp.get<Result<CashierItemConfig>>({
    url: '/isv/cashier/config/findItemById',
    params: {
      groupId,
    },
  })
}

/**
 * 保存配置项配置
 */
export function saveItemConfig(data: CashierItemConfig) {
  return defHttp.post<Result<CashierItemConfig>>({
    url: '/isv/cashier/config/saveItem',
    data,
  })
}

/**
 * 更新配置项配置
 */
export function updateItemConfig(data: CashierItemConfig) {
  return defHttp.post<Result<CashierItemConfig>>({
    url: '/isv/cashier/config/updateItem',
    data,
  })
}

/**
 * 删除配置项配置
 */
export function delItemConfig(id) {
  return defHttp.post({
    url: '/isv/cashier/config/deleteItem',
    params: { id },
  })
}

/**
 * 收银台类目配置
 */
export interface CashierGroupConfig extends MchEntity {
  /** 类型 web/h5/小程序 */
  type?: string
  /** 类型 web/h5/小程序(换成这个了) */
  cashierType?: string
  /** 名称 */
  name?: string
  /** 图标 */
  icon?: string
  /** 排序 */
  sortNo?: number
  // 背景色
  bgColor?: string
  // 是否推荐
  recommend?: boolean
}
/**
 * 收银台配置项
 */
export interface CashierItemConfig extends MchEntity {
  /** 类目配置Id */
  groupId?: string
  /** 名称 */
  name?: string
  /** 图标 */
  icon?: string
  /** 排序 */
  sortNo?: number
  /** 发起调用的类型 */
  callType?: string
  /** 支付通道 */
  channel?: string
  /** 支付方式 */
  payMethod?: string
  /** 其他支付方式 */
  otherMethod?: string
  /** 是否推荐 */
  recommend?: boolean
}
