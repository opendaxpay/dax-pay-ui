import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商通道商户 API
 */
export const WechatIsvChannelMerchantApi = {
  /**
   * 创建微信服务商通道商户
   */
  create(data: WechatIsvChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询微信服务商通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<WechatIsvChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/wechat/isv-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
};

/**
 * 微信直连通道商户 API
 */
export const WechatDirectChannelMerchantApi = {
  /**
   * 创建微信直连通道商户
   */
  create(data: WechatDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/direct-channel-merchant/create', data });
  },
  /**
   * 更新微信直连通道商户(转账场景/微信商户号)
   */
  update(data: WechatDirectChannelMerchantUpdateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/direct-channel-merchant/update', data });
  },
  /**
   * 根据通道商户号查询微信直连通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<WechatDirectChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/wechat/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 根据通道商户号查询密钥配置
   */
  findKeyConfig(channelMchNo: string): Promise<Result<WechatDirectKeyConfig>> {
    return defHttp.get({
      url: '/admin/wechat/direct-channel-merchant/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: WechatDirectKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/direct-channel-merchant/save-key-config', data });
  },
  /**
   * 查询微信转账场景选项列表
   */
  findSceneOptions(): Promise<Result<WechatTransferSceneOption[]>> {
    return defHttp.get({
      url: '/admin/wechat/direct-channel-merchant/scene-options',
    });
  },
};

/**
 * 微信服务商通道商户配置
 */
export interface WechatIsvChannelMerchantConfig extends MchEntity {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 微信特约商户号/二级商户号 */
  subMchId?: string;
}

/**
 * 微信直连通道商户配置
 */
export interface WechatDirectChannelMerchantConfig extends MchEntity {
  /** 通道商户号(系统生成雪花号) */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 微信直连商户号 */
  wxMchId?: string;
  /** 转账场景ID */
  transferScene?: string;
}

/**
 * 微信服务商通道商户创建参数
 */
export interface WechatIsvChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 微信特约商户号/二级商户号 */
  subMchId: string;
}

/**
 * 微信直连密钥配置
 */
export interface WechatDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** API V3密钥 */
  apiKeyV3?: string;
  /** 支付公钥 */
  publicKey?: string;
  /** 支付公钥ID */
  publicKeyId?: string;
  /** 商户私钥 */
  privateKey?: string;
  /** 商户证书 */
  privateCert?: string;
  /** 证书序列号 */
  certSerialNo?: string;
}

/**
 * 微信直连通道商户创建参数
 */
export interface WechatDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 微信直连商户号 */
  wxMchId: string;
  /** 转账场景ID */
  transferScene?: string;
}

/**
 * 微信直连通道商户更新参数
 */
export interface WechatDirectChannelMerchantUpdateParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 微信直连商户号 */
  wxMchId?: string;
  /** 转账场景ID */
  transferScene?: string;
}

/**
 * 微信转账场景选项
 */
export interface WechatTransferSceneOption {
  /** 转账场景ID */
  code: string;
  /** 场景名称 */
  name: string;
  /** 报备字段定义(微信协议固定中文 infoType) */
  reportInfoTypes: string[];
  /** 报备字段说明(与 reportInfoTypes 平行, 含微信文档示例) */
  reportInfoDescriptions?: string[];
  /** 用户收款感知可选值(收款人在微信中看到的文案) */
  userRecvPerceptionOptions?: string[];
}
