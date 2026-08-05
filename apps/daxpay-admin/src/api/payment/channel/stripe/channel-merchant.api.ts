import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Stripe 通道商户 API
 */
export const StripeChannelMerchantApi = {
  /**
   * 根据通道商户号查询 Stripe 通道商户配置(含 Stripe 账户 ID)
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<StripeChannelMerchantResult>> {
    return defHttp.get({
      url: '/admin/stripe/channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 创建 Stripe 通道商户(写入 Stripe 账户 ID accountId, 密钥由密钥配置单独维护)
   */
  create(data: StripeChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/stripe/channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询密钥配置(密钥按环境 test/live 分别存储)
   */
  findKeyConfig(channelMchNo: string): Promise<Result<StripeKeyConfig>> {
    return defHttp.get({
      url: '/admin/stripe/channel-merchant/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: StripeKeyConfigParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/stripe/channel-merchant/save-key-config', data });
  },
};

/**
 * Stripe 密钥配置(密钥脱敏回显, 测试/生产环境由密钥前缀 sk_test_/sk_live_ 自标识)
 */
export interface StripeKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** Stripe Secret Key(sk_test_xxx 沙箱 / sk_live_xxx 生产, 已脱敏) */
  secretKey?: string;
  /** Stripe Publishable Key(pk_test_xxx 沙箱 / pk_live_xxx 生产, 已脱敏) */
  publishableKey?: string;
  /** Webhook 签名密钥(whsec_xxx, 已脱敏) */
  webhookSecret?: string;
  /** Secret Key 是否已配置 */
  secretKeyConfigured?: boolean;
  /** Publishable Key 是否已配置 */
  publishableKeyConfigured?: boolean;
  /** Webhook 签名密钥是否已配置 */
  webhookSecretConfigured?: boolean;
}

/**
 * Stripe 密钥配置保存参数
 */
export interface StripeKeyConfigParam {
  /** 通道商户号(唯一标识) */
  channelMchNo: string;
  /** 商户号 */
  mchNo: string;
  /** Stripe Secret Key(sk_test_xxx 沙箱 / sk_live_xxx 生产) */
  secretKey?: string;
  /** Stripe Publishable Key(pk_test_xxx 沙箱 / pk_live_xxx 生产) */
  publishableKey?: string;
  /** Webhook 签名密钥(whsec_xxx) */
  webhookSecret?: string;
}

/**
 * Stripe 通道商户创建参数
 */
export interface StripeChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** Stripe 账户 ID(acct_xxx) */
  accountId: string;
}

/**
 * Stripe 通道商户配置结果
 */
export interface StripeChannelMerchantResult {
  /** 商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** Stripe 账户 ID(acct_xxx) */
  accountId?: string;
}
