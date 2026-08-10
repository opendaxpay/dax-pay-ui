import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/** 分账订单管理 API */
export const AllocOrderApi = {
  /** 分页查询分账订单 */
  page(
    params: AllocOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<AllocOrderResult>>> {
    return defHttp.get({ url: '/mch/alloc/page', params });
  },
  /** 根据ID查询分账订单详情 */
  getById(id: string): Promise<Result<AllocOrderResult>> {
    return defHttp.get({ url: '/mch/alloc/get-by-id', params: { id } });
  },
  /** 发起分账 */
  create(data: AllocParam): Promise<Result<AllocCreateResult>> {
    return defHttp.post({ url: '/mch/alloc/create', data });
  },
  /** 同步分账状态(主动向通道查询) */
  sync(allocNo: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/alloc/sync', params: { allocNo } });
  },
};

/** 分账订单查询参数 */
export interface AllocOrderQuery {
  /** 平台分账单号 */
  allocNo?: string;
  /** 商户分账单号 */
  bizAllocNo?: string;
  /** 原支付资金交易号 */
  tradeNo?: string;
  /** 商户业务订单号 */
  bizOrderNo?: string;
  /** 支付通道 */
  channel?: string;
  /** 分账状态 */
  status?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 分账发起参数 */
export interface AllocParam {
  /** 商户分账单号 */
  bizAllocNo: string;
  /** 原支付资金交易号 */
  tradeNo?: string;
  /** 原支付商户业务订单号 */
  bizOrderNo?: string;
  /** 分账标题 */
  title?: string;
  /** 分账描述 */
  description?: string;
  /** 接收方列表 */
  receivers: AllocReceiverParam[];
  /** 商户扩展参数 */
  attach?: string;
  /** 异步通知地址 */
  notifyUrl?: string;
}

/** 分账接收方参数 */
export interface AllocReceiverParam {
  /** 接收方类型 MERCHANT_ID/PERSONAL_OPENID/USER_ID/LOGIN_NAME */
  receiverType: string;
  /** 接收方账号 */
  receiverAccount: string;
  /** 接收方姓名 */
  receiverName?: string;
  /** 分账金额(元) */
  amount: number;
}

/** 分账发起结果 */
export interface AllocCreateResult {
  /** 平台分账单号 */
  allocNo?: string;
  /** 商户分账单号 */
  bizAllocNo?: string;
  /** 分账状态 */
  status?: string;
}

/** 分账订单结果 */
export interface AllocOrderResult extends MchEntity {
  /** 平台分账单号 */
  allocNo?: string;
  /** 商户分账单号 */
  bizAllocNo?: string;
  /** 原支付资金交易号 */
  tradeNo?: string;
  /** 原支付交易形态 */
  tradeType?: string;
  /** 商户业务订单号 */
  bizOrderNo?: string;
  /** 通道支付订单号 */
  outOrderNo?: string;
  /** 通道分账单号 */
  outAllocNo?: string;
  /** 标题 */
  title?: string;
  /** 分账描述 */
  description?: string;
  /** 分账总金额(分) */
  amount?: number;
  /** 原订单总金额(分) */
  orderAmount?: number;
  /** 币种 */
  currency?: string;
  /** 分账状态 */
  status?: string;
  /** 分账完成时间 */
  finishTime?: string;
  /** 支付通道 */
  channel?: string;
  /** 支付渠道 */
  provider?: string;
  /** 支付产品编码 */
  product?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户扩展参数 */
  attach?: string;
  /** 错误码 */
  errorCode?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 明细列表 */
  details?: AllocDetailResult[];
}

/** 分账明细结果 */
export interface AllocDetailResult {
  /** 分账单号 */
  allocNo?: string;
  /** 接收方类型 */
  receiverType?: string;
  /** 接收方账号 */
  receiverAccount?: string;
  /** 接收方姓名 */
  receiverName?: string;
  /** 分账金额(分) */
  amount?: number;
  /** 明细结果 */
  result?: string;
  /** 通道侧明细ID */
  outDetailId?: string;
  /** 错误信息 */
  errorMsg?: string;
  /** 明细完成时间 */
  finishTime?: string;
}
