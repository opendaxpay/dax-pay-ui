import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道服务商级接入配置 API(网关基地址 + 独立签名密钥)
 *
 * 接入材料在模拟网关控制台·主体档案·服务商处生成, 运营端复制粘贴至此;
 * 按服务商编号(isvNo)定位记录 upsert, 服务商级未配置时回落通道级全局密钥。
 */
export const MockIsvCredentialApi = {
  /**
   * 查询服务商接入配置(敏感字段脱敏回显, 未保存过时 configured=false)
   */
  getMockIsvCredential(isvNo: string): Promise<Result<MockIsvCredentialResult>> {
    return defHttp.get({ url: '/admin/mock/isv-credential/get', params: { isvNo } });
  },

  /**
   * 保存服务商接入配置(两段 PEM 未改动/留空不提交, 后端空值不覆盖)
   */
  saveMockIsvCredential(data: MockIsvCredentialParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/isv-credential/save', data });
  },
};

/**
 * Mock 服务商接入配置查询结果(敏感字段脱敏展示)
 */
export interface MockIsvCredentialResult {
  /** 服务商编号 */
  isvNo?: string;
  /** 是否已配置(商户私钥与平台公钥均非空) */
  configured?: boolean;
  /** 服务商接入网关地址(可空) */
  gatewayBaseUrl?: string;
  /** 商户私钥(脱敏串) */
  merchantPrivateKeyMasked?: string;
  /** 平台验签公钥(脱敏串) */
  platformPublicKeyMasked?: string;
  /** 最近一次保存时间(UTC ISO 串) */
  updateTime?: string;
}

/**
 * Mock 服务商接入配置保存参数(敏感字段留空/不提交=保留原值)
 */
export interface MockIsvCredentialParam {
  /** 服务商编号(系统生成) */
  isvNo: string;
  /** 服务商接入网关地址(可空) */
  gatewayBaseUrl?: string;
  /** 商户私钥(PEM PKCS#8 原文, 留空表示不修改) */
  merchantPrivateKey?: string;
  /** 平台验签公钥(PEM SPKI 原文, 留空表示不修改) */
  platformPublicKey?: string;
}
