import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 签名调试 API
 */
export const DevelopSignApi = {
  /**
   * 生成签名
   */
  sign(data: DevelopSignParam): Promise<Result<DevelopSignResult>> {
    return defHttp.post({ url: '/admin/develop/sign/gen', data });
  },

  /**
   * 验签
   */
  verify(data: DevelopVerifyParam): Promise<Result<boolean>> {
    return defHttp.post({ url: '/admin/develop/sign/verify', data });
  },
};

/** 签名调试-生成签名参数 */
export interface DevelopSignParam {
  /** 待签名 JSON 字符串 */
  json: string;
  /** 私钥(PEM 格式) */
  privateKey: string;
}

/** 签名调试-验签参数 */
export interface DevelopVerifyParam {
  /** 待验签 JSON 字符串(不含 sign 字段) */
  json: string;
  /** 签名值 */
  sign: string;
  /** 公钥(PEM 格式) */
  publicKey: string;
}

/** 签名调试结果 */
export interface DevelopSignResult {
  /** 待签名原文 */
  signStr?: string;
  /** 签名值 */
  sign?: string;
}
