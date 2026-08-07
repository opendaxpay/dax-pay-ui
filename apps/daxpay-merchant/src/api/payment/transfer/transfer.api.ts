import type { BaseEntity, MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 转账单管理 API（商户端）
 */
export const TransferApi = {
  // ===== 微信转账 =====

  /** 微信转账单分页 */
  wechatPage(
    params: WechatTransferOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<WechatTransferOrderResult>>> {
    return defHttp.get({ url: '/mch/transfer/wechat/page', params });
  },

  /** 微信转账单详情 */
  wechatGetById(id: string): Promise<Result<WechatTransferOrderResult>> {
    return defHttp.get({ url: '/mch/transfer/wechat/get-by-id', params: { id } });
  },

  /** 发起微信转账（FAIL 单复用原单号即重试） */
  wechatCreate(data: TransferParam): Promise<Result<TransferCreateResult>> {
    return defHttp.post({ url: '/mch/transfer/wechat/create', data });
  },

  // ===== 支付宝转账 =====

  /** 支付宝转账单分页 */
  alipayPage(
    params: AlipayTransferOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<AlipayTransferOrderResult>>> {
    return defHttp.get({ url: '/mch/transfer/alipay/page', params });
  },

  /** 支付宝转账单详情 */
  alipayGetById(id: string): Promise<Result<AlipayTransferOrderResult>> {
    return defHttp.get({ url: '/mch/transfer/alipay/get-by-id', params: { id } });
  },

  /** 发起支付宝转账 */
  alipayCreate(data: TransferParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/transfer/alipay/create', data });
  },

  // ===== 抖音转账 =====

  /** 抖音转账单分页 */
  douyinPage(
    params: DouyinTransferOrderQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<DouyinTransferOrderResult>>> {
    return defHttp.get({ url: '/mch/transfer/douyin/page', params });
  },

  /** 抖音转账单详情 */
  douyinGetById(id: string): Promise<Result<DouyinTransferOrderResult>> {
    return defHttp.get({ url: '/mch/transfer/douyin/get-by-id', params: { id } });
  },

  /** 发起抖音转账 */
  douyinCreate(data: TransferParam): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/transfer/douyin/create', data });
  },

  // ===== 公共操作 =====

  /** 同步转账状态 */
  sync(channel: string, id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/transfer/sync', params: { channel, id } });
  },

  /** 关闭转账（仅通道支持场景有效） */
  close(channel: string, id: string): Promise<Result<void>> {
    return defHttp.post({ url: '/mch/transfer/close', params: { channel, id } });
  },

  // ===== 转账记录（公共资金凭证） =====

  /** 转账记录分页（跨通道） */
  tradePage(
    params: TransferTradeQuery & { current?: number; size?: number },
  ): Promise<Result<PageResult<TransferTradeResult>>> {
    return defHttp.get({ url: '/mch/transfer/trade/page', params });
  },

  /** 转账记录详情 */
  tradeGetById(id: string): Promise<Result<TransferTradeResult>> {
    return defHttp.get({ url: '/mch/transfer/trade/get-by-id', params: { id } });
  },
};

/** 微信转账单查询参数 */
export interface WechatTransferOrderQuery {
  mchNo?: string;
  appId?: string;
  transferNo?: string;
  bizTransferNo?: string;
  payeeOpenid?: string;
  /** 转账状态 processing/success/fail/close */
  status?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 支付宝转账单查询参数 */
export interface AlipayTransferOrderQuery {
  mchNo?: string;
  appId?: string;
  transferNo?: string;
  bizTransferNo?: string;
  /** 收款人账号类型 user_id/open_id/login_name */
  payeeType?: string;
  payeeAccount?: string;
  /** 转账状态 */
  status?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 抖音转账单查询参数 */
export interface DouyinTransferOrderQuery {
  mchNo?: string;
  appId?: string;
  transferNo?: string;
  bizTransferNo?: string;
  payeeType?: string;
  payeeAccount?: string;
  /** 转账状态 */
  status?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 转账记录查询参数（跨通道） */
export interface TransferTradeQuery {
  mchNo?: string;
  appId?: string;
  tradeNo?: string;
  /** 所属通道 wechat/alipay/douyin */
  containerChannel?: string;
  /** 转账状态 */
  status?: string;
  createTimeStart?: string;
  createTimeEnd?: string;
}

/** 转账发起参数（运营端代发传 mchNo） */
export interface TransferParam {
  /** 商户号（运营端代发必填；商户端忽略） */
  mchNo?: string;
  /** 应用号（可空，默认商户默认应用） */
  appId?: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 商户转账号（幂等键） */
  bizTransferNo: string;
  /** 转账金额（元） */
  amount: number;
  /** 转账标题 */
  title?: string;
  /** 转账原因/备注 */
  reason?: string;
  /** 收款人账号类型 openid/user_id/open_id/login_name */
  payeeType: string;
  /** 收款人账号 */
  payeeAccount: string;
  /** 收款人姓名 */
  payeeName?: string;
  /** 商户扩展参数，回调原样返回 */
  attach?: string;
  /** 回调通知地址 */
  notifyUrl?: string;
  /** 转账场景配置ID(支付宝专用,不传用通道商户默认场景) */
  transferSceneConfigId?: string;
  /** 转账场景ID(抖音专用,主数据枚举1001-1007,发起转账时选择) */
  transferScene?: string;
  /** 用户收款感知(抖音专用,收款人在抖音中看到的文案) */
  userRecvPerception?: string;
  /** 转账场景报备信息(微信/支付宝/抖音转账按场景填写) */
  reportInfos?: TransferReportInfo[];
}

/** 转账场景报备信息项 */
export interface TransferReportInfo {
  /** 信息类型(微信协议固定中文) */
  infoType: string;
  /** 信息内容(商户自定义填写) */
  infoContent?: string;
}

/** 转账发起结果 */
export interface TransferCreateResult {
  /** 平台转账单号 */
  transferNo?: string;
  /** 确认收款链接(微信转账) */
  confirmUrl?: string;
}

/** 微信转账单结果 */
export interface WechatTransferOrderResult extends MchEntity {
  channelMchNo?: string;
  transferNo?: string;
  bizTransferNo?: string;
  outTransferNo?: string;
  amount?: number;
  currency?: string;
  title?: string;
  reason?: string;
  /** 转账状态 */
  status?: string;
  finishTime?: string;
  /** 收款人微信 openid */
  payeeOpenid?: string;
  /** 转账场景 */
  transferScene?: string;
  /** 拉起转账确认参数 */
  transferBody?: string;
  /** 收款人姓名 */
  userName?: string;
  notifyUrl?: string;
  attach?: string;
  reqTime?: string;
  errorMsg?: string;
}

/** 支付宝转账单结果 */
export interface AlipayTransferOrderResult extends MchEntity {
  channelMchNo?: string;
  transferNo?: string;
  bizTransferNo?: string;
  outTransferNo?: string;
  amount?: number;
  currency?: string;
  title?: string;
  reason?: string;
  status?: string;
  finishTime?: string;
  /** 收款人账号类型 */
  payeeType?: string;
  payeeAccount?: string;
  payeeName?: string;
  notifyUrl?: string;
  attach?: string;
  reqTime?: string;
  errorMsg?: string;
}

/** 抖音转账单结果 */
export interface DouyinTransferOrderResult extends MchEntity {
  channelMchNo?: string;
  transferNo?: string;
  bizTransferNo?: string;
  outTransferNo?: string;
  amount?: number;
  currency?: string;
  title?: string;
  reason?: string;
  status?: string;
  finishTime?: string;
  payeeType?: string;
  payeeAccount?: string;
  payeeName?: string;
  /** 转账场景ID */
  transferScene?: string;
  notifyUrl?: string;
  attach?: string;
  reqTime?: string;
  errorMsg?: string;
}

/** 转账记录结果（跨通道资金凭证） */
export interface TransferTradeResult extends BaseEntity {
  mchNo?: string;
  mchName?: string;
  appId?: string;
  tradeNo?: string;
  containerId?: string;
  /** 所属通道 wechat/alipay/douyin */
  containerChannel?: string;
  channel?: string;
  provider?: string;
  amount?: number;
  currency?: string;
  status?: string;
  outTransferNo?: string;
  relationNo?: string;
  finishTime?: string;
  title?: string;
}
