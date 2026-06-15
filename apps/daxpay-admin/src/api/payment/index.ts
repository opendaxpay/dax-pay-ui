/**
 * 支付域 barrel
 *
 * - channel / merchant 各子域内文件较多，且各渠道存在同名 ChannelMerchantApi，
 *   采用命名空间聚合，避免冲突；具体 API 与类型建议从各子文件直接 import。
 * - config / route / masterdata 顶层无命名冲突，可直接导出。
 */
export * as Channel from './channel';
export * as Merchant from './merchant';
export * from './config/pay-product-config.api';
export * from './route/pay-route.api';
export * from './masterdata/capability.api';
export * from './masterdata/channel.api';
export * from './masterdata/product.api';
export * from './masterdata/provider.api';
