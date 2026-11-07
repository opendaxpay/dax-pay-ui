import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道商户 API(建档入口; 列表/详情统一走通用通道商户链路)
 *
 * 模拟通道仅 DEV 装配, 商户档案纯本地登记(不调用通道侧接口), 沙箱标记由后端固定为 true。
 */
export const MockChannelMerchantApi = {
  /**
   * 创建 Mock 直连通道商户(mock_pay 产品)
   *
   * 纯本地登记: 登记模拟通道控制台已创建的商户号; 模拟通道为独立通道, 无对接接口。
   */
  createMockDirectMerchant(data: MockChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/channel-merchant/create', data });
  },

  /**
   * 创建 Mock 服务商通道商户(mock_isv 产品)
   *
   * 双表建档: 通用通道商户主表 + 服务商归属绑定表, 归属服务商创建时选定、之后不可改。
   */
  createMockIsvMerchant(data: MockIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/isv-channel-merchant/create', data });
  },

  /**
   * 查询服务商通道商户绑定(详情工作台基本信息展示, 带出归属服务商与子商户号)
   */
  findMockIsvMerchant(channelMchNo: string): Promise<Result<MockIsvChannelMerchantResult>> {
    return defHttp.get({ url: '/admin/mock/isv-channel-merchant/find', params: { channelMchNo } });
  },
};

/**
 * Mock 直连通道商户创建参数(mock_pay, 纯本地登记, 商户级无对接配置)
 */
export interface MockChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号(模拟通道控制台创建的商户号, 必填) */
  channelMchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品(mock_pay) */
  product: string;
}

/**
 * Mock 服务商通道商户创建参数(mock_isv)
 */
export interface MockIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 归属模拟服务商主键(mock_isv_info.id) */
  isvId: string;
  /** 通道商户号(可空, 空则后端按 MOCK 前缀自动生成; 非空则登记模拟通道控制台创建的子商户号) */
  channelMchNo?: string;
  /** 通道商户名称 */
  channelMerchantName: string;
}

/**
 * Mock 服务商通道商户绑定结果(详情工作台基本信息展示, 直连产品不适用)
 */
export interface MockIsvChannelMerchantResult extends BaseEntity {
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品(恒为 mock_isv) */
  product?: string;
  /** 归属模拟服务商主键 */
  isvId?: string;
  /** 归属服务商编号 */
  isvNo?: string;
  /** 归属服务商名称 */
  isvName?: string;
}
