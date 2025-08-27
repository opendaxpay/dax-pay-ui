import { defHttp } from '@/utils/http/axios'
import { Result } from '#/axios'
import { MchEntity } from '#/web'

/**
 * 获取网关支付配置
 */
export function getConfig(appId) {
  return defHttp.get<Result<GatewayConfig>>({
    url: '/gateway/config/getConfig',
    params: {
      appId,
    },
  })
}

/**
 * 保存网关支付配置
 */
export function saveConfig(data: GatewayConfig) {
  return defHttp.post<Result<GatewayConfig>>({
    url: '/gateway/config/save',
    data,
  })
}

/**
 * 更新网关支付配置
 */
export function updateConfig(data: GatewayConfig) {
  return defHttp.post<Result<GatewayConfig>>({
    url: '/gateway/config/update',
    data,
  })
}

/**
 * 收银台配置
 */
export interface GatewayConfig extends MchEntity {
  /** 读取系统配置 */
  readSystem?: boolean
  /** 收银台名称 */
  name?: string
  /** PC收银台是否同时显示聚合收银码 */
  aggregateShow?: boolean
  /** PC收银台是否显示聚合条码支付 */
  barPayShow?: boolean
  /** h5收银台自动升级聚合支付 */
  h5AutoUpgrade?: boolean
  /** 小程序开启分账 */
  miniAppAllocation?: boolean
  /** 小程序自动分账 */
  miniAppAutoAllocation?: boolean
  /** 限制小程序支付方式 */
  miniAppLimitPay?: string
  /** 小程序关联终端号 */
  miniAppTerminalNo?: string
}
