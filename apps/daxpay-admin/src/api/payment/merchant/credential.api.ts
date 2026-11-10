import type { BaseEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 商户对接配置 API
 */
export const MerchantCredentialApi = {
  /**
   * 根据商户号查询对接配置
   */
  findByMchNo(mchNo: string): Promise<Result<MerchantCredentialResult>> {
    return defHttp.get({ url: '/admin/merchant/credential/get-by-mch-no', params: { mchNo } });
  },
  /**
   * 更新商户对接配置
   */
  update(data: MerchantCredentialParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/merchant/credential/update', data });
  },
};

/**
 * 商户对接配置结果
 */
export interface MerchantCredentialResult extends BaseEntity {
  /** 商户公钥 */
  publicKey?: string;
  /** 平台公钥 */
  platformPublicKey?: string;
  /** 通信密钥 */
  secretKey?: string;
  /** 凭证是否已配置完整(商户公钥与通信密钥均非空) */
  credentialConfigured?: boolean;
  /** 商户公钥是否已配置 */
  publicKeyConfigured?: boolean;
  /** 通信密钥是否已配置 */
  secretKeyConfigured?: boolean;
  /** 最后修改时间(UTC ISO 串, 展示须走 formatDateTime) */
  lastModifiedTime?: string;
}

/**
 * 商户对接配置参数
 */
export interface MerchantCredentialParam {
  /** 商户号 */
  mchNo: string;
  /** 商户公钥 */
  publicKey?: string;
  /** 通信密钥 */
  secretKey?: string;
}
