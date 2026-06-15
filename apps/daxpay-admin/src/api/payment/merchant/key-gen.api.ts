import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * RSA密钥对结果
 */
export interface RsaKeyPairResult {
  /** 公钥PEM格式 */
  publicKey?: string;
  /** 私钥PEM格式 */
  privateKey?: string;
}

/**
 * 密钥生成 API
 */
export const KeyGenApi = {
  /**
   * 生成RSA密钥对
   */
  genRsaKeyPair(): Promise<Result<RsaKeyPairResult>> {
    return defHttp.post({ url: '/key-gen/gen-rsa-key-pair' });
  },
  /**
   * 生成AES通信密钥
   */
  genAesSecretKey(): Promise<Result<string>> {
    return defHttp.post({ url: '/key-gen/gen-aes-secret-key' });
  },
};
