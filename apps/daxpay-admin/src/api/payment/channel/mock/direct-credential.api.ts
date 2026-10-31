import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道直连商户级对接配置 API(网关基地址 + 每商户独立签名密钥)
 *
 * 接入材料在模拟网关控制台·主体档案·该商户的密钥管理处生成, 运营端复制粘贴至此;
 * 未配置时回落通道级全局密钥(见 credential.api)。
 */
export const MockDirectCredentialApi = {
  /**
   * 查询直连商户对接配置(敏感字段脱敏回显, 未保存过时 configured=false)
   */
  findMockDirectCredential(channelMchNo: string): Promise<Result<MockDirectCredentialResult>> {
    return defHttp.get({ url: '/admin/mock/direct-credential/find', params: { channelMchNo } });
  },

  /**
   * 保存直连商户对接配置(两段 PEM 未改动/留空不提交, 后端空值不覆盖)
   */
  saveMockDirectCredential(data: MockDirectCredentialParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/direct-credential/save', data });
  },
};

/**
 * Mock 直连商户对接配置查询结果(敏感字段脱敏展示)
 */
export interface MockDirectCredentialResult {
  /** 通道商户号 */
  channelMchNo?: string;
  /** 是否已配置(商户私钥与平台公钥均非空) */
  configured?: boolean;
  /** 商户接入网关地址(可空) */
  gatewayBaseUrl?: string;
  /** 商户私钥(脱敏串) */
  merchantPrivateKeyMasked?: string;
  /** 平台验签公钥(脱敏串) */
  platformPublicKeyMasked?: string;
  /** 最近一次保存时间(UTC ISO 串) */
  updateTime?: string;
}

/**
 * Mock 直连商户对接配置保存参数(敏感字段留空/不提交=保留原值)
 */
export interface MockDirectCredentialParam {
  /** 通道商户号 */
  channelMchNo: string;
  /** 商户接入网关地址(可空) */
  gatewayBaseUrl?: string;
  /** 商户私钥(PEM PKCS#8 原文, 留空表示不修改) */
  merchantPrivateKey?: string;
  /** 平台验签公钥(PEM SPKI 原文, 留空表示不修改) */
  platformPublicKey?: string;
}
