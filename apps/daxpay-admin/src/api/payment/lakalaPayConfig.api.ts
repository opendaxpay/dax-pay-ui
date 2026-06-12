import type { MchEntity, Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 拉卡拉产品支付配置 API
 */
export const LakalaPayConfigApi = {
  /**
   * 查询拉卡拉产品配置详情
   */
  findConfig(isvNo: string, product: string, sandbox: boolean): Promise<Result<LakalaProductConfig>> {
    return defHttp.get({ url: '/admin/lakala/product-pay-config/find-config', params: { isvNo, product, sandbox } });
  },
  /**
   * 保存拉卡拉产品配置
   */
  saveConfig(data: LakalaProductConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/lakala/product-pay-config/save-config', data });
  },
};

/** 拉卡拉产品支付配置 */
export interface LakalaProductConfig extends MchEntity {
  /** 是否启用 */
  enable?: boolean;
  /** 沙箱环境 */
  sandbox?: boolean;
  /** 拉卡拉应用编号 */
  lklAppId?: string;
  /** 商户证书序列号 */
  mchSerialNo?: string;
  /** 私钥 */
  privateKey?: string;
  /** 公钥 */
  publicKey?: string;
  /** sm4密钥 */
  sm4Key?: string;
  /** 产品类型 */
  product?: string;
  /** 通道 */
  channel?: string;
}
