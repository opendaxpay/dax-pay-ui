import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 交易开发调试 API
 */
export const DevelopTradeApi = {
  /**
   * 支付参数签名
   */
  sign(data: DevelopParam): Promise<Result<DevelopSignResult>> {
    return defHttp.post({ url: '/admin/develop/trade/sign', data });
  },

  /**
   * 支付调试(真实发起)
   */
  pay(data: DevelopParam): Promise<Result<DevelopPayResult>> {
    return defHttp.post({ url: '/admin/develop/trade/pay', data });
  },
};

/** 开发调试参数包装 */
export interface DevelopParam {
  /** 业务参数 */
  param: PayParam;
  /** 生成签名使用的私钥(PEM 格式, 不入库) */
  privateKey?: string;
}

/** 支付参数 */
export interface PayParam {
  /** 商户号 */
  mchNo: string;
  /** 应用号 */
  appId?: string;
  /** 通道商户号(调试/指定通道商户时传入) */
  channelMchNo?: string;
  /** 商户订单号 */
  bizOrderNo: string;
  /** 支付标题 */
  title: string;
  /** 支付描述 */
  description?: string;
  /** 支付金额(元) */
  amount: number;
  /** 支付产品编码, 为空时由路由自动选择 */
  product?: string;
  /** 支付方式编码 */
  method: string;
  /** 用户标识 OpenId(微信 jsapi/mini 场景) */
  openId?: string;
  /** 付款码(被扫支付) */
  authCode?: string;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 同步跳转地址 */
  returnUrl?: string;
  /** 过期时间(北京时间 yyyy-MM-dd HH:mm:ss) */
  expiredTime?: string;
}

/** 支付结果 */
export interface PayResult {
  /** 订单ID */
  orderId?: string;
  /** 商户订单号 */
  bizOrderNo?: string;
  /** 订单号 */
  orderNo?: string;
  /** 支付状态 */
  status?: string;
  /** 支付参数体 */
  payBody?: string;
  /** 支付参数体类型 */
  payBodyType?: string;
}

/** 签名调试结果 */
export interface DevelopSignResult {
  /** 待签名原文 */
  signStr?: string;
  /** 签名值 */
  sign?: string;
}

/** 支付调试结果 */
export interface DevelopPayResult {
  /** 请求体 JSON */
  requestBody?: string;
  /** 签名信息 */
  signInfo?: DevelopSignResult;
  /** 支付结果 */
  payResult?: PayResult;
}
