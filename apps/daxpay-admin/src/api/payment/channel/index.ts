/**
 * 通道域 barrel
 *
 * 注意：各渠道下均有 ChannelMerchantApi / 类型同名导出，
 * 这里采用「按渠道命名空间」聚合导出，避免命名冲突；
 * 具体类型请从各子文件直接 import。
 */
export * as AlipayChannel from './alipay';
export * as WechatChannel from './wechat';
export * as LakalaChannel from './lakala';
export * as UmsChannel from './ums';
export * as DouyinChannel from './douyin';
export * as AdapayChannel from './adapay';
export * as HkrtChannel from './hkrt';
export * as DougongChannel from './dougong';

// 通用通道商户（已迁至 payment/global；无命名冲突，直接导出）
export { ChannelMerchantApi } from '../global/channel-merchant/channel-merchant.api';
export type {
  ChannelMerchantBaseCreateParam,
  ChannelMerchantEditParam,
  ChannelMerchantQueryParam,
  ChannelMerchantResult,
} from '../global/channel-merchant/channel-merchant.api';
