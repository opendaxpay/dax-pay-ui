import type { Result } from '#/types/web';

import JSEncrypt from 'jsencrypt';

import { requestClient } from '#/api/request';

let cachedPublicKey: null | string = null;

/**
 * 获取RSA公钥
 */
function getPublicKey(): Promise<Result<string>> {
  return requestClient.get('/token/public-key');
}

/**
 * 加密密码
 * @param password 明文密码
 */
export async function encryptPassword(password: string): Promise<string> {
  if (!cachedPublicKey) {
    const { data: publicKey } = await getPublicKey();
    if (!publicKey) {
      throw new Error('获取RSA公钥失败');
    }
    cachedPublicKey = publicKey;
  }

  const encrypt = new JSEncrypt();
  encrypt.setPublicKey(cachedPublicKey);
  const encrypted = encrypt.encrypt(password);
  if (!encrypted) {
    throw new Error('密码加密失败');
  }
  return encrypted;
}
