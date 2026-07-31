import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 网关支付开发调试 API
 *
 * 仅组参辅助与签名, 真实预下单见 unipay-trade.api (POST /unipay/gateway/pre-pay)
 */
export const DevelopGatewayApi = {
  /**
   * 网关预下单参数签名
   */
  sign(data: DevelopGatewayParam): Promise<Result<DevelopSignResult>> {
    return defHttp.post({ url: '/mch/develop/gateway/sign', data });
  },
};

/** 开发调试参数包装 */
export interface DevelopGatewayParam {
  /** 业务参数 */
  param: GatewayPrePayParam;
  /** 生成签名使用的私钥(PEM 格式, 不入库) */
  privateKey?: string;
}

/** 签名调试结果 */
export interface DevelopSignResult {
  /** 待签名原文 */
  signStr?: string;
  /** 签名值 */
  sign?: string;
}

/** 网关预下单参数(与 unipay GatewayPrePayParam 对齐) */
export interface GatewayPrePayParam {
  /** 商户号 */
  mchNo: string;
  /** 应用号 */
  appId?: string;
  /** 商户订单号 */
  bizOrderNo: string;
  /** 支付标题 */
  title: string;
  /** 支付描述 */
  description?: string;
  /** 支付金额(分) */
  amount: number;
  /** 网关支付类型: cashier(统一收银台) / aggregate(聚合扫码) */
  gatewayPayType: string;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 同步跳转地址 */
  returnUrl?: string;
  /** 商户附加参数 */
  attach?: string;
  /** 支付扩展参数(JSON) */
  extraParam?: string;
  /** 过期时间(北京时间 yyyy-MM-dd HH:mm:ss) */
  expiredTime?: string;
  /** 门店号 */
  storeNo?: string;
  /** 请求ID(商户生成, 审计索引, 必填) */
  reqId?: string;
  /** 随机串 */
  nonceStr?: string;
  /** 请求时间(北京时间 yyyy-MM-dd HH:mm:ss) */
  reqTime?: string;
  /** 签名 */
  sign?: string;
}

/** 网关预下单结果 */
export interface GatewayPrePayResult {
  /** 平台网关单号 */
  orderNo?: string;
  /** 商户业务单号 */
  bizOrderNo?: string;
  /** 业务状态 */
  status?: string;
  /** 网关支付类型(实际生效类型; 幂等命中时为已有订单的类型) */
  gatewayType?: string;
  /** 网关落地页 URL */
  h5Url?: string;
  /** 小程序映射 URL */
  miniUrl?: string;
  /** 过期时间 */
  expiredTime?: string;
}
