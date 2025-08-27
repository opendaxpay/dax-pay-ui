import { defHttp } from '@/utils/http/axios'
import { PageResult, Result } from '#/axios'
import { MchEntity } from '#/web'

/**
 * 分页查询
 */
export function page(queryParam) {
  return defHttp.get<Result<PageResult<CashierCode>>>({
    url: '/cashier/code/page',
    params: queryParam,
  })
}

/**
 * 查询详情
 */
export function get(id) {
  return defHttp.get<Result<CashierCode>>({
    url: '/cashier/code/findById',
    params: { id },
  })
}

/**
 * 批量创建
 */
export function createBatch(data: CashierCodeBatch) {
  return defHttp.post<Result<CashierCode>>({
    url: '/cashier/code/createBatch',
    data,
  })
}

/**
 * 修改
 */
export function update(data) {
  return defHttp.post<Result<void>>({
    url: '/cashier/code/update',
    data,
  })
}

/**
 * 绑定商户和应用
 */
export function bindMch(data) {
  return defHttp.post<Result<void>>({
    url: '/cashier/code/bindMerchant',
    data,
  })
}

/**
 * 取消绑定商户
 */
export function unbindMch(data) {
  return defHttp.post<Result<void>>({
    url: '/cashier/code/unbindMerchant',
    data,
  })
}

/**
 * 绑定应用
 */
export function bindApp(data) {
  return defHttp.post<Result<void>>({
    url: '/cashier/code/bindApp',
    data,
  })
}

/**
 * 解绑应用
 */
export function unbindApp(data) {
  return defHttp.post<Result<void>>({
    url: '/cashier/code/unbindApp',
    data,
  })
}

/**
 * 删除
 */
export function del(id) {
  return defHttp.post<Result<void>>({
    url: '/cashier/code/delete',
    params: { id },
  })
}

/**
 * 判断是否存在
 */
export function existsByBatchNo(batchNo) {
  return defHttp.get<Result<boolean>>({
    url: '/cashier/code/existsByBatchNo',
    params: { batchNo },
  })
}
/**
 * 判断是否存在
 */
export function getCodeLink(code) {
  return defHttp.get<Result<string>>({
    url: '/cashier/code/getCodeLink',
    params: { code },
  })
}

/**
 * 收款码牌
 */
export interface CashierCode extends MchEntity {
  /** 固定金额/任意金额 */
  amountType?: string
  /** 金额 */
  amount?: number
  /** 名称 */
  name?: string
  /** 编号 */
  code?: string
  /** 配置Id */
  configId?: number
  /** 模板ID */
  templateId?: number
  /** 状态 */
  enable?: boolean
  /** 批次号 */
  batchNo?: string
}

/**
 * 批量创建收款码参数
 * @author xxm
 * @since 2025/7/1
 */
export interface CashierCodeBatch {
  /** 批次号 */
  batchNo?: string
  /** 创建数量 */
  count?: number
  /** 模板Id */
  templateId?: number
  /** 配置Id */
  configId?: number
  /** 金额类型 */
  amountType?: string
  /** 金额 */
  amount?: number
  /** 状态 */
  enable?: boolean
}
