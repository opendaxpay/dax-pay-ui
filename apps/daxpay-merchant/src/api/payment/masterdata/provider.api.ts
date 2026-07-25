/**
 * 支付渠道方式目录 — 类型定义
 *
 * 商户端仅消费类型(交易调试页 method-directory 下拉使用), 无平台管理类 API。
 * 平台管理(listByProvider/get/switchEnabled)仅运营端拥有。
 */

/** 渠道支付方式行 */
export interface PayProviderMethod {
  provider: string;
  method: string;
  methodLabel?: string;
  sortNo?: number;
  // 目录项说明
  description?: string;
  supportedProducts?: PayProviderProduct[];
}

/** 渠道支付方式支持的支付产品 */
export interface PayProviderProduct {
  label: string;
  value: string;
  channel?: string;
  channelName?: string;
}
