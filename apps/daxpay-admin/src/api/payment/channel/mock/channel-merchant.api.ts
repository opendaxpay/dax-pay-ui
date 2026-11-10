import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道商户 API(建档入口; 列表/详情统一走通用通道商户链路)
 *
 * 模拟通道仅 DEV 装配, 商户档案纯本地登记(不调用通道侧接口), 沙箱标记由后端固定为 true;
 * mock_pay(直连)与 mock_isv(服务商)共用同一建档接口, 由 product 参数区分产品。
 */
export const MockChannelMerchantApi = {
  /**
   * 创建 Mock 通道商户(mock_pay / mock_isv 共用)
   *
   * 纯本地登记: 登记模拟通道控制台已创建的商户号; 服务商形态归属全局唯一模拟服务商, 无需传服务商。
   */
  createMockMerchant(data: MockChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/channel-merchant/create', data });
  },
};

/**
 * Mock 通道商户创建参数(mock_pay / mock_isv 共用)
 */
export interface MockChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号(模拟通道控制台创建的商户号, 必填) */
  channelMchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品(mock_pay / mock_isv, 必填) */
  product: string;
}
