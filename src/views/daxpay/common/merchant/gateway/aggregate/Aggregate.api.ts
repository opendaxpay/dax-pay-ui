import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'

/**
 * 获取聚合支付配置(列表)
 */
export function getAggregateConfigs(appId) {
  return defHttp.get<Result<AggregateConfig[]>>({
    url: '/aggregate/config/listByPay',
    params: {
      appId,
    },
  })
}
/**
 * 获取聚合支付配置(根据Id)
 */
export function getAggregateConfig(id) {
  return defHttp.get<Result<AggregateConfig>>({
    url: '/aggregate/config/findPayById',
    params: {
      id,
    },
  })
}

/**
 * 聚合支付配置是否存在
 */
export function existsAggregateConfig(appId, type) {
  return defHttp.get<Result<boolean>>({
    url: '/aggregate/config/existsPay',
    params: {
      appId,
      type,
    },
  })
}

/**
 * 聚合支付配置是否存在(不包含自身)
 */
export function existsAggregateConfigNotId(appId, type, id) {
  return defHttp.get<Result<boolean>>({
    url: '/aggregate/config/existsPayNotId',
    params: {
      appId,
      type,
      id,
    },
  })
}

/**
 * 保存聚合支付配置
 */
export function saveAggregateConfig(data: AggregateConfig) {
  return defHttp.post<Result<AggregateConfig>>({
    url: '/aggregate/config/savePay',
    data,
  })
}

/**
 * 更新聚合支付配置
 */
export function updateAggregateConfig(data: AggregateConfig) {
  return defHttp.post<Result<AggregateConfig>>({
    url: '/aggregate/config/updatePay',
    data,
  })
}

/**
 * 删除聚合支付配置
 */
export function delAggregateConfig(id) {
  return defHttp.post({
    url: '/aggregate/config/deletePay',
    params: { id },
  })
}

/**
 * 获取聚合付款码支付配置(列表)
 */
export function getAggregatePayCodeConfigs(appId) {
  return defHttp.get<Result<AggregatePayCodeConfig[]>>({
    url: '/aggregate/config/listByBar',
    params: {
      appId,
    },
  })
}

/**
 * 获取聚合付款码支付配置(根据ID)
 */
export function getAggregatePayCodeConfig(id) {
  return defHttp.get<Result<AggregateConfig>>({
    url: '/aggregate/config/findBarById',
    params: {
      id,
    },
  })
}

/**
 * 聚合付款码支付配置是否存在
 */
export function existsAggregatePayCodeConfig(appId, type) {
  return defHttp.get<Result<boolean>>({
    url: '/aggregate/config/existsBar',
    params: {
      appId,
      type,
    },
  })
}

/**
 * 聚合付款码支付配置是否存在(不包含自身)
 */
export function existsAggregatePayCodeConfigNotId(appId, type, id) {
  return defHttp.get<Result<boolean>>({
    url: '/aggregate/config/existsBarNotId',
    params: {
      appId,
      type,
      id,
    },
  })
}

/**
 * 保存聚合付款码支付配置
 */
export function saveAggregatePayCodeConfig(data: AggregateConfig) {
  return defHttp.post<Result<AggregateConfig>>({
    url: '/aggregate/config/saveBar',
    data,
  })
}

/**
 * 更新聚合付款码支付配置
 */
export function updateAggregatePayCodeConfig(data: AggregateConfig) {
  return defHttp.post<Result<AggregateConfig>>({
    url: '/aggregate/config/updateBar',
    data,
  })
}

/**
 * 删除聚合付款码支付配置
 */
export function delAggregatePayCodeConfig(id) {
  return defHttp.post({
    url: '/aggregate/config/deleteBar',
    params: { id },
  })
}

/**
 * 收银台聚合扫码支付配置
 */
export interface AggregateConfig extends MchEntity {
  /** 支付类型 */
  type?: string
  /** 支付类型(换成这个了) */
  aggregateType?: string
  /** 通道 */
  channel?: string
  /** 支付方式 */
  payMethod?: string
  /** 自动拉起支付 */
  autoLaunch?: boolean
  /** 需要获取OpenId */
  needOpenId?: boolean
  /** 其他支付方式 */
  otherMethod?: string
  /** 发起调用的类型 */
  callType?: string
}

/**
 * 收银台聚合付款码支付配置
 */
export interface AggregatePayCodeConfig extends MchEntity {
  /** 付款码类型 */
  barPayType?: string
  /** 通道 */
  channel?: string
  /** 支付方式 */
  payMethod?: string
  /** 其他支付方式 */
  otherMethod?: string
  /** 自动拉起支付 */
  autoLaunch?: boolean
  /** 需要获取OpenId */
  needOpenId?: boolean
}
