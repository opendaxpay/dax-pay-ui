import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * Mock 模拟通道网关签名密钥 API(通道级全局单行配置, 与模拟网关侧密钥成对一致)
 *
 * 消费方: 模拟器/模拟服务商管理页的「密钥配置」入口, 未配置时商户级与服商级接入配置均不可用。
 */
export const MockCredentialApi = {
  /**
   * 查询通道级密钥配置(敏感字段后端脱敏回显, 未配置时 configured=false)
   */
  getMockCredential(): Promise<Result<MockCredentialResult>> {
    return defHttp.get({ url: '/admin/mock/credential/get' });
  },

  /**
   * 保存通道级密钥配置(留空或原样未改的敏感字段表示不修改)
   */
  saveMockCredential(data: MockCredentialParam): Promise<Result<void>> {
    return defHttp.post({ url: '/admin/mock/credential/save', data });
  },
};

/**
 * Mock 通道级签名密钥配置(敏感字段脱敏展示)
 */
export interface MockCredentialResult {
  /** 商户私钥(PEM PKCS#8, 请求签名用, 脱敏) */
  merchantPrivateKey?: string;
  /** 平台公钥(PEM SPKI, 响应验签用, 脱敏) */
  platformPublicKey?: string;
  /** 是否已配置完整(两密钥均非空) */
  configured?: boolean;
}

/**
 * Mock 通道级签名密钥保存参数(未修改的敏感字段不传, 后端空值不覆盖)
 */
export interface MockCredentialParam {
  /** 商户私钥(PEM PKCS#8 原文, 留空表示不修改) */
  merchantPrivateKey?: string;
  /** 平台公钥(PEM SPKI 原文, 留空表示不修改) */
  platformPublicKey?: string;
}
