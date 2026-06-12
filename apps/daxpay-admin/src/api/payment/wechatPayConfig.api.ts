import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 微信服务商密钥配置 API
 */
export const WechatPayConfigApi = {
  /**
   * 查询微信服务商密钥配置
   * 注意: 微信服务商模式不支持沙箱环境
   */
  findConfig(isvNo: string, product: string): Promise<Result<WechatIsvKeyConfig>> {
    return defHttp.get({ url: '/admin/wechat/isv-key-config/find-config', params: { isvNo, product } });
  },
  /**
   * 保存微信服务商密钥配置
   */
  saveConfig(data: WechatIsvKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/wechat/isv-key-config/save-config', data });
  },
};

/** 微信服务商密钥配置 */
export interface WechatIsvKeyConfig extends MchEntity {
  /** 是否启用 */
  enable?: boolean;
  /** 微信服务商商户号 */
  wxMchId?: string;
  /** APIv3密钥 */
  apiKeyV3?: string;
  /** 公钥 */
  publicKey?: string;
  /** 公钥ID */
  publicKeyId?: string;
  /** 应用私钥 */
  privateKey?: string;
  /** 应用证书 */
  privateCert?: string;
  /** 证书序列号 */
  certSerialNo?: string;
  /** 产品类型 */
  product?: string;
  /** 通道 */
  channel?: string;
}
