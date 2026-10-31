import type {
  AllocReceiverBindParam,
  AllocReceiverCreateParam,
  AllocReceiverQueryParam,
  AllocReceiverResult,
} from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

import {
  AlipayDirectAllocReceiverApi,
  AlipayIsvAllocReceiverApi,
  DouyinDirectAllocReceiverApi,
  MockAllocReceiverApi,
  WechatDirectAllocReceiverApi,
  WechatIsvAllocReceiverApi,
} from '#/api/payment/global/alloc-receiver/alloc-receiver.api';

/** 应用选择模式(按支付产品区分) */
export type AppMode = 'alipay' | 'douyin' | 'none' | 'wechat-isv' | 'wechat-merchant';

/** 产品 → 接收方配置 */
export interface ProductConfig {
  api: {
    bind: (id: string, data?: AllocReceiverBindParam) => Promise<unknown>;
    create: (data: AllocReceiverCreateParam) => Promise<unknown>;
    delete: (id: string) => Promise<unknown>;
    page: (
      params: AllocReceiverQueryParam,
    ) => Promise<{ data: { current?: number; records?: AllocReceiverResult[]; size?: number; total?: number } }>;
    unbind: (id: string) => Promise<unknown>;
    updateAlias: (id: string, alias: string) => Promise<unknown>;
  };
  appMode: AppMode;
  /** 是否有分账关系类型(微信/抖音) */
  hasRelation: boolean;
  receiverTypes: string[];
}

/**
 * 支付产品 → 接收方绑定配置映射(单一事实源, 新增产品仅在此加一行)
 * 关系类型下拉不提供 service_provider(微信通道保留值, 后端映射为 CUSTOM+自定义名)
 */
export const PRODUCT_CONFIG: Record<string, ProductConfig> = {
  alipay: {
    api: AlipayDirectAllocReceiverApi,
    appMode: 'alipay',
    hasRelation: false,
    receiverTypes: ['USER_ID', 'LOGIN_NAME'],
  },
  alipay_isv: {
    api: AlipayIsvAllocReceiverApi,
    appMode: 'none',
    hasRelation: false,
    receiverTypes: ['USER_ID', 'LOGIN_NAME'],
  },
  douyin_pay: {
    api: DouyinDirectAllocReceiverApi,
    appMode: 'douyin',
    hasRelation: true,
    receiverTypes: ['MERCHANT_ID', 'PERSONAL_OPENID'],
  },
  // 模拟通道(直连/服务商共用): 零资料接入, 无应用维度、无分账关系语义,
  // 类型只开商户号与用户ID; 两端点同前缀, 产品由后端按通道商户反解
  mock_isv: {
    api: MockAllocReceiverApi,
    appMode: 'none',
    hasRelation: false,
    receiverTypes: ['MERCHANT_ID', 'USER_ID'],
  },
  mock_pay: {
    api: MockAllocReceiverApi,
    appMode: 'none',
    hasRelation: false,
    receiverTypes: ['MERCHANT_ID', 'USER_ID'],
  },
  wechat_isv: {
    api: WechatIsvAllocReceiverApi,
    appMode: 'wechat-isv',
    hasRelation: true,
    receiverTypes: ['MERCHANT_ID', 'PERSONAL_OPENID', 'PERSONAL_SUB_OPENID'],
  },
  wechat_pay: {
    api: WechatDirectAllocReceiverApi,
    appMode: 'wechat-merchant',
    hasRelation: true,
    receiverTypes: ['MERCHANT_ID', 'PERSONAL_OPENID'],
  },
};

/** 分账关系类型(不含服务商保留值) */
export const RELATION_TYPES = [
  'store',
  'staff',
  'store_owner',
  'partner',
  'headquarter',
  'brand',
  'distributor',
  'user',
  'supplier',
  'custom',
];

/** 绑定状态 → tag 颜色 */
export const STATUS_COLOR: Record<string, string> = {
  bound: 'success',
  fail: 'error',
  unbound: 'default',
};

/**
 * 接收方类型文案的 i18n key(产品级覆盖)
 *
 * mock 的 USER_ID 是模拟通道内的用户标识, 不是支付宝账号, 沿用「支付宝用户ID」文案会误导运营。
 */
export function receiverTypeI18nKey(product: string, code?: string): string {
  if (product?.startsWith('mock') && code === 'USER_ID') {
    return 'payment.channel.mock.type.userId';
  }
  return `payment.channel.allocReceiver.type.${code ?? ''}`;
}
