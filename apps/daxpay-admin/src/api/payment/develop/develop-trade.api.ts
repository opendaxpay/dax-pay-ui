import type { PayProviderMethod } from '#/api/payment/masterdata/provider.api';
import type { ChannelMchOption, LabelValue, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 交易开发调试 API
 *
 * 仅组参辅助与签名, 真实支付见 unipay-trade.api (POST /unipay/pay)
 */
export const DevelopTradeApi = {
  /**
   * 支付参数签名
   */
  sign(data: DevelopParam): Promise<Result<DevelopSignResult>> {
    return defHttp.post({ url: '/admin/develop/trade/sign', data });
  },

  /**
   * 已启用渠道支付方式目录(供调试页支付方式下拉)
   */
  methodDirectory(): Promise<Result<PayProviderMethod[]>> {
    return defHttp.get({ url: '/admin/develop/trade/method-directory' });
  },

  /**
   * 直接指定: 按商户号筛选通道商户候选, provider 非空时仅返回声明支持该支付渠道的通道商户
   */
  channelMchCandidates(mchNo: string, provider?: string): Promise<Result<ChannelMchOption[]>> {
    return defHttp.get({
      url: '/admin/develop/trade/channel-mch-candidates',
      params: { mchNo, provider },
    });
  },

  /**
   * 直接指定: 按通道商户筛选支付能力候选
   */
  capabilityCandidates(channelMchNo: string): Promise<Result<LabelValue[]>> {
    return defHttp.get({
      url: '/admin/develop/trade/capability-candidates',
      params: { channelMchNo },
    });
  },
};

/** 开发调试参数包装 */
export interface DevelopParam {
  /** 业务参数 */
  param: PayParam;
  /** 生成签名使用的私钥(PEM 格式, 不入库) */
  privateKey?: string;
}

/** 支付参数(与 unipay NormalPayParam 对齐) */
export interface PayParam {
  /** 商户号 */
  mchNo: string;
  /** 应用号 */
  appId?: string;
  /** 通道商户号(调试/直接指定时传入) */
  channelMchNo?: string;
  /** 商户订单号 */
  bizOrderNo: string;
  /** 支付标题 */
  title: string;
  /** 支付描述 */
  description?: string;
  /** 支付金额(分) */
  amount: number;
  /** 支付产品编码, 为空时由路由自动选择 */
  product?: string;
  /** 支付方式编码(跟随通道路由必填, 直接指定由后端从能力反推) */
  method?: string;
  /** 支付能力编码(直接指定输入, 跟随通道路由由后端回填) */
  capability?: string;
  /** 用户标识 OpenId(微信 jsapi/mini 场景) */
  openId?: string;
  /** 付款码(被扫支付) */
  authCode?: string;
  /** 异步通知地址 */
  notifyUrl?: string;
  /** 同步跳转地址 */
  returnUrl?: string;
  /** 商户附加参数(回调原样返回) */
  attach?: string;
  /** 支付扩展参数(JSON, 通道长尾参数) */
  extraParam?: string;
  /** 限制支付类型(如 no_credit 禁信用卡) */
  limitPay?: string[];
  /** 过期时间(北京时间 yyyy-MM-dd HH:mm:ss) */
  expiredTime?: string;
  /** 客户端 IP(可选, 未传时由 unipay 从 HTTP 请求提取) */
  clientIp?: string;
  /** 请求ID(商户生成, 审计索引, 必填) */
  reqId?: string;
  /** 随机串 */
  nonceStr?: string;
  /** 请求时间(北京时间 yyyy-MM-dd HH:mm:ss) */
  reqTime?: string;
  /** 签名 */
  sign?: string;
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
