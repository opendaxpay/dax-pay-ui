import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 抖音直连通道商户 API
 */
export const DouyinDirectChannelMerchantApi = {
  /**
   * 创建抖音直连通道商户
   */
  create(data: DouyinDirectChannelMerchantCreateParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/direct-channel-merchant/create', data });
  },
  /**
   * 根据通道商户号查询抖音直连通道商户配置
   */
  findByChannelMchNo(channelMchNo: string): Promise<Result<DouyinDirectChannelMerchantConfig>> {
    return defHttp.get({
      url: '/admin/douyin/direct-channel-merchant/find-by-channel-mch-no',
      params: { channelMchNo },
    });
  },
  /**
   * 根据通道商户号查询密钥配置
   */
  findKeyConfig(channelMchNo: string): Promise<Result<DouyinDirectKeyConfig>> {
    return defHttp.get({
      url: '/admin/douyin/direct-channel-merchant/find-key-config',
      params: { channelMchNo },
    });
  },
  /**
   * 保存密钥配置
   */
  saveKeyConfig(data: DouyinDirectKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/douyin/direct-channel-merchant/save-key-config', data });
  },
  /**
   * 查询抖音转账场景选项列表(主数据枚举, 供发起转账页选择)
   */
  findSceneOptions(): Promise<Result<DouyinTransferSceneOption[]>> {
    return defHttp.get({ url: '/admin/douyin/direct-channel-merchant/scene-options' });
  },
};

/**
 * 抖音直连通道商户配置
 */
export interface DouyinDirectChannelMerchantConfig extends MchEntity {
  /** 通道商户号(系统生成雪花号) */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 抖音商户号(MCHID) */
  dyMchId?: string;
}

/**
 * 抖音直连密钥配置
 */
export interface DouyinDirectKeyConfig {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 商户号 */
  mchNo?: string;
  /** 商户私钥 */
  merchantPrivateKey?: string;
  /** 商家公钥证书序列号 */
  merchantSerialNumber?: string;
  /** 接口加密密钥 */
  encryptKey?: string;
  /** 私钥是否已配置 */
  privateKeyConfigured?: boolean;
  /** 加密密钥是否已配置 */
  encryptKeyConfigured?: boolean;
}

/**
 * 抖音直连通道商户创建参数
 */
export interface DouyinDirectChannelMerchantCreateParam {
  /** 商户号 */
  mchNo: string;
  /** 通道商户名称 */
  channelMerchantName: string;
  /** 所属支付产品 */
  product: string;
  /** 抖音商户号(MCHID) */
  dyMchId: string;
}

/**
 * 抖音转账场景选项(主数据枚举, 供发起转账页选择与报备字段动态渲染)
 */
export interface DouyinTransferSceneOption {
  /** 转账场景ID */
  code?: string;
  /** 场景名称 */
  name?: string;
  /** 报备字段定义(抖音协议固定中文 infoType) */
  reportInfoTypes?: string[];
  /** 报备字段说明(与 reportInfoTypes 平行) */
  reportInfoDescriptions?: string[];
  /** 用户收款感知可选值(收款人在抖音中看到的文案) */
  userRecvPerceptionOptions?: string[];
}
