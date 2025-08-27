import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { MchEntity } from '#/web'
import { LabeledValue } from 'ant-design-vue/lib/select'

/**
 * 分页查询
 */
export function page(queryParam) {
  return defHttp.get<Result<PageResult<CashierCodeConfig>>>({
    url: '/admin/cashier/code/config/page',
    params: queryParam,
  })
}

/**
 * 查询配置详情
 */
export function get(id) {
  return defHttp.get<Result<CashierCodeConfig>>({
    url: '/admin/cashier/code/config/findById',
    params: { id },
  })
}

/**
 * 码牌配置保存
 */
export function save(data) {
  return defHttp.post<Result<string>>({
    url: '/admin/cashier/code/config/save',
    data,
  })
}

/**
 * 码牌配置更新
 */
export function update(data) {
  return defHttp.post<Result<string>>({
    url: '/admin/cashier/code/config/update',
    data,
  })
}

/**
 * 码牌配置删除
 */
export function del(id) {
  return defHttp.post<Result<string>>({
    url: '/admin/cashier/code/config/remove',
    params: { id },
  })
}

/**
 * 获取码牌支付场景配置列表
 */
export function getCodeSceneConfigs(configId) {
  return defHttp.get<Result<Array<CashierCodeSceneConfig>>>({
    url: '/admin/cashier/code/config/scene/findAll',
    params: { configId },
  })
}

/**
 * 获取支付场景配置
 */
export function getCodeSceneConfig(id) {
  return defHttp.get<Result<CashierCodeSceneConfig>>({
    url: '/admin/cashier/code/config/scene/findById',
    params: { id },
  })
}

/**
 * 码牌支付场景配置保存
 */
export function saveCodeSceneConfig(data) {
  return defHttp.post<Result<string>>({
    url: '/admin/cashier/code/config/scene/save',
    data,
  })
}

/**
 * 码牌支付场景配置更新
 */
export function updateCodeSceneConfig(data) {
  return defHttp.post<Result<string>>({
    url: '/admin/cashier/code/config/scene/update',
    data,
  })
}

/**
 * 码牌支付场景配置删除
 */
export function removeCodeSceneConfig(id) {
  return defHttp.post<Result<string>>({
    url: '/admin/cashier/code/config/scene/remove',
    params: { id },
  })
}

/**
 * 码牌支付场景配置是否存在
 */
export function existsCodeSceneConfig(configId, scene) {
  return defHttp.get<Result<boolean>>({
    url: '/admin/cashier/code/config/scene/exists',
    params: { configId, scene },
  })
}

/**
 * 码牌支付场景配置是否存在
 */
export function existsCodeSceneConfigNotId(configId, scene, id) {
  return defHttp.get<Result<boolean>>({
    url: '/admin/cashier/code/config/scene/existsNotId',
    params: { configId, scene, id },
  })
}

/**
 * 下拉
 */
export function dropdown(){
  return defHttp.get<Result<LabeledValue[]>>({
    url: '/admin/cashier/code/config/dropdown',
  })
}

/**
 * 收银码牌配置
 */
export interface CashierCodeConfig extends MchEntity {
  /** 配置名称 */
  name?: string
  /** 是否启用 */
  enable?: boolean
  /** 是否开启分账 */
  allocation?: boolean
  /** 自动分账 */
  autoAllocation?: boolean
  /** 限制用户支付方式 */
  limitPay?: string
  /** 备注 */
  remark?: string
}

/**
 * 码牌支付配置明细
 * @author xxm
 * @since 2024/11/20
 */
export interface CashierCodeSceneConfig extends MchEntity{
  /** 配置ID */
  configId?: string
  /** 收银场景 */
  scene?: string
  /** 支付通道 */
  channel?: string
  /** 支付方式 */
  payMethod?: string
  /** 其他支付方式 */
  otherMethod?: string
  /** 需要获取OpenId */
  needOpenId?: boolean
  /** OpenId获取方式 */
  openIdGetType?: string
  /** 发起调用的类型 */
  callType?: string
}
