import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道服务商 API(全局唯一服务商, 产品工作台使用)
 *
 * 模拟通道取消多服务商模式: 全局仅一份模拟服务商记录与一份全局接入密钥,
 * 前端只读展示编号与支付开关, 不提供增删与下拉查询; 编号允许按网关控制台档案手工修改。
 */
export const MockIsvInfoApi = {
  /**
   * 查询当前全局模拟服务商
   */
  current(): Promise<Result<MockIsvInfoResult>> {
    return defHttp.get({ url: '/admin/mock/isv-info/current' });
  },

  /**
   * 修改服务商编号(须与 mock 网关控制台商户档案的 isv_no 一致)
   */
  updateIsvNo(isvNo: string): Promise<Result<MockIsvInfoResult>> {
    return defHttp.post({ url: '/admin/mock/isv-info/update-isv-no', params: { isvNo } });
  },

  /**
   * 切换服务商支付开关(仅拦新支付, 退款/关单/查询/回调不受影响)
   */
  switchPay(payEnable: boolean): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/isv-info/switch-pay', params: { payEnable } });
  },
};

/**
 * 全局模拟服务商信息(编号/名称/启停状态)
 */
export interface MockIsvInfoResult {
  /** 主键(后端 Long 按字符串序列化) */
  id: string;
  /** 服务商编号(系统生成, 全局唯一) */
  isvNo: string;
  /** 服务商名称 */
  isvName: string;
  /** 是否允许新建服务商通道商户 */
  enable: boolean;
  /** 是否启用服务商支付 */
  payEnable: boolean;
}
