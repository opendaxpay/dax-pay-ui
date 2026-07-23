import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * RSA 密钥对结果
 */
export interface RsaKeyPairResult {
  /** 公钥 PEM 格式 */
  publicKey?: string;
  /** 私钥 PEM 格式 */
  privateKey?: string;
}

/**
 * 密钥生成 API（平台共用 /key-gen/*，商户端可直接调用）
 */
export const KeyGenApi = {
  /**
   * 生成 RSA 密钥对
   */
  genRsaKeyPair(): Promise<Result<RsaKeyPairResult>> {
    return defHttp.post({ url: '/key-gen/gen-rsa-key-pair' });
  },
  /**
   * 生成 AES 通信密钥
   */
  genAesSecretKey(): Promise<Result<string>> {
    return defHttp.post({ url: '/key-gen/gen-aes-secret-key' });
  },
};
