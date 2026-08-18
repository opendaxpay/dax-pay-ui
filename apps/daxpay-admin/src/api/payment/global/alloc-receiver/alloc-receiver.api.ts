import type { MchEntity, PageResult, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 分账接收方(通道侧绑定) API
 *
 * 五种模式共用同一套契约, 仅 URL 前缀不同:
 * - 微信直连 /admin/wechat/direct-alloc-receiver
 * - 微信服务商 /admin/wechat/isv-alloc-receiver
 * - 支付宝直连 /admin/alipay/direct-alloc-receiver
 * - 支付宝服务商 /admin/alipay/isv-alloc-receiver
 * - 抖音直连 /admin/douyin/direct-alloc-receiver
 */

/** 接收方 API 工厂(五组端点契约同构) */
function receiverApi(prefix: string) {
  return {
    /** 分页查询 */
    page(params: AllocReceiverQueryParam): Promise<Result<PageResult<AllocReceiverResult>>> {
      return defHttp.get({ url: `${prefix}/page`, params });
    },
    /** 新增并绑定接收方(同步调通道, 失败记录保留) */
    create(data: AllocReceiverCreateParam): Promise<Result<void>> {
      return defHttp.post({ url: `${prefix}/create`, data });
    },
    /** 重新绑定(绑定失败/已解绑状态, 可更换绑定所用应用) */
    bind(id: string, data?: AllocReceiverBindParam): Promise<Result<void>> {
      return defHttp.post({ url: `${prefix}/bind`, data: { id, ...data } });
    },
    /** 解绑(已绑定状态, 保留记录) */
    unbind(id: string): Promise<Result<void>> {
      return defHttp.post({ url: `${prefix}/unbind`, params: { id } });
    },
    /** 删除(仅绑定失败/已解绑状态) */
    delete(id: string): Promise<Result<void>> {
      return defHttp.post({ url: `${prefix}/delete`, params: { id } });
    },
  };
}

/** 微信直连分账接收方 */
export const WechatDirectAllocReceiverApi = receiverApi('/admin/wechat/direct-alloc-receiver');
/** 微信服务商分账接收方 */
export const WechatIsvAllocReceiverApi = receiverApi('/admin/wechat/isv-alloc-receiver');
/** 支付宝直连分账接收方 */
export const AlipayDirectAllocReceiverApi = receiverApi('/admin/alipay/direct-alloc-receiver');
/** 支付宝服务商分账接收方 */
export const AlipayIsvAllocReceiverApi = receiverApi('/admin/alipay/isv-alloc-receiver');
/** 抖音直连分账接收方 */
export const DouyinDirectAllocReceiverApi = receiverApi('/admin/douyin/direct-alloc-receiver');

/**
 * 分账接收方扫码授权 API(跨通道统一接口, 复用认证域 OAuth + queryCode 轮询机制)
 */
export const AllocReceiverScanAuthApi = {
  /** 生成接收方扫码授权链接(前端渲染二维码) */
  generateUrl(data: AllocReceiverScanAuthParam): Promise<Result<AllocReceiverScanAuthUrlResult>> {
    return defHttp.post({ url: '/admin/channel/merchant/alloc-scan-auth/generate-url', data });
  },
  /** 通过查询码轮询授权结果 */
  queryResult(queryCode: string): Promise<Result<AllocReceiverScanAuthResult>> {
    return defHttp.get({ url: '/admin/channel/merchant/alloc-scan-auth/query-result', params: { queryCode } });
  },
};

/**
 * 分账接收方结果(五种模式字段并集, 通道差异字段按模式为空)
 */
export interface AllocReceiverResult extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 接收方类型(MERCHANT_ID/PERSONAL_OPENID/PERSONAL_SUB_OPENID/USER_ID/LOGIN_NAME) */
  receiverType?: string;
  /** 接收方账号(解密后明文) */
  receiverAccount?: string;
  /** 接收方名称 */
  receiverName?: string;
  /** 分账关系类型(微信/抖音) */
  relationType?: string;
  /** 自定义分账关系名 */
  customRelation?: string;
  /** 绑定所用微信/抖音应用 appid(直连) */
  channelAppId?: string;
  /** 服务商应用 appid(微信服务商) */
  spAppId?: string;
  /** 子商户应用 appid(微信服务商) */
  subAppId?: string;
  /** 发起绑定的支付宝应用引用(支付宝直连) */
  directAppRefId?: string;
  /** 绑定状态(bound/unbound/fail) */
  status?: string;
  /** 最近一次绑定/解绑失败原因 */
  errorMsg?: string;
  /** 绑定成功时间 */
  bindTime?: string;
  /** 解绑成功时间 */
  unbindTime?: string;
}

/**
 * 分账接收方查询参数
 */
export interface AllocReceiverQueryParam {
  /** 页码 */
  current?: number;
  /** 每页条数 */
  size?: number;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属商户号 */
  mchNo?: string;
  /** 接收方类型 */
  receiverType?: string;
  /** 绑定状态 */
  status?: string;
}

/**
 * 分账接收方新增(绑定)参数(通道差异字段按模式收集)
 */
export interface AllocReceiverCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号 */
  channelMchNo: string;
  /** 接收方类型 */
  receiverType: string;
  /** 接收方账号 */
  receiverAccount: string;
  /** 接收方名称 */
  receiverName?: string;
  /** 分账关系类型(微信/抖音必填) */
  relationType?: string;
  /** 自定义分账关系名(relationType=CUSTOM 时必填) */
  customRelation?: string;
  /** 绑定所用应用 appid(微信直连/抖音) */
  channelAppId?: string;
  /** 服务商应用 appid(微信服务商) */
  spAppId?: string;
  /** 子商户应用 appid(微信服务商, PERSONAL_SUB_OPENID 时必填) */
  subAppId?: string;
  /** 发起绑定的支付宝应用引用(支付宝直连) */
  appRefId?: string;
}

/**
 * 分账接收方重新绑定参数(应用字段留空则沿用落库值)
 */
export interface AllocReceiverBindParam {
  /** 绑定所用应用 appid(微信直连/抖音) */
  channelAppId?: string;
  /** 服务商应用 appid(微信服务商) */
  spAppId?: string;
  /** 子商户应用 appid(微信服务商) */
  subAppId?: string;
  /** 发起绑定的支付宝应用引用(支付宝直连) */
  appRefId?: string;
}

/** 应用下拉选项(通用形态, 各通道应用列表适配) */
export interface AllocReceiverAppOption {
  label: string;
  value: string;
}

/**
 * 分账接收方扫码授权参数(应用传原始 appId, 后端解析)
 */
export interface AllocReceiverScanAuthParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 支付产品编码(wechat_pay/wechat_isv/alipay/alipay_isv/douyin_pay) */
  product: string;
  /** 接收方类型(PERSONAL_OPENID/PERSONAL_SUB_OPENID/USER_ID) */
  receiverType: string;
  /** 绑定应用 appId(微信直连/抖音, openid 为该应用维度) */
  channelAppId?: string;
  /** 服务商应用 appId(微信服务商, PERSONAL_OPENID 维度) */
  spAppId?: string;
  /** 子商户应用 appId(微信服务商, PERSONAL_SUB_OPENID 维度) */
  subAppId?: string;
}

/** 扫码授权链接结果 */
export interface AllocReceiverScanAuthUrlResult {
  /** 授权访问链接 */
  authUrl?: string;
  /** 查询标识码 */
  queryCode?: string;
}

/** 扫码授权结果 */
export interface AllocReceiverScanAuthResult {
  /** OpenId(微信/抖音) */
  openId?: string;
  /** 用户ID(支付宝 2088) */
  userId?: string;
  /** 状态 waiting/success/fail/not_exist */
  status?: string;
}
