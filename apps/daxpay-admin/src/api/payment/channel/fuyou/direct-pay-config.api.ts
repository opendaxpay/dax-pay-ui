import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 富友直连商户密钥配置 API（商户移动支付前置接口）
 */
export const FuyouDirectPayConfigApi = {
  /**
   * 查询富友直连商户密钥配置（按通道商户维度）
   */
  findConfig(channelMchNo: string): Promise<Result<FuyouDirectKeyConfig>> {
    return defHttp.get({ url: '/admin/fuyou/direct-key-config/find-config', params: { channelMchNo } });
  },
  /**
   * 保存富友直连商户密钥配置
   */
  saveConfig(data: FuyouDirectKeyConfig): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/fuyou/direct-key-config/save-config', data });
  },
};

/** 富友直连商户密钥配置 */
export interface FuyouDirectKeyConfig {
  /** 主键 */
  id?: string;
  /** 平台商户号 */
  mchNo?: string;
  /** 通道商户号 */
  channelMchNo?: string;
  /** 所属支付产品 */
  product?: string;
  /** 富友商户号(mchnt_cd) */
  mchntCd?: string;
  /** 商户密钥(mchnt_key, 加密存储) */
  mchntKey?: string;
  /** 终端号(term_id) */
  termNo?: string;
  /** 是否沙箱环境 */
  sandbox?: boolean;
}
