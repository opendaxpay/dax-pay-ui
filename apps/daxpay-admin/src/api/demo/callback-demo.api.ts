import type { Result } from '#/types/web';

import { defHttp } from '#/api/request';

/**
 * 回调接收演示 API
 */
export const CallbackDemoApi = {
  /**
   * 拉取回调接收记录（最新在前）
   */
  list(): Promise<Result<CallbackRecord[]>> {
    return defHttp.get({ url: '/test/callback/list' });
  },

  /**
   * 清空回调接收记录
   */
  clear(): Promise<Result<void>> {
    return defHttp.post({ url: '/test/callback/clear' });
  },
};

/**
 * 回调接收记录
 */
export interface CallbackRecord {
  /** 记录 ID（字符串避免精度丢失） */
  id: string;
  /** 通知事件码（如 pay.success / refund.success） */
  event: string;
  /** 业务类型（pay / refund / unknown） */
  bizType: string;
  /** 商户号 */
  mchNo: string;
  /** 应用ID */
  appId: string;
  /** 业务号 */
  bizNo: string;
  /** 金额（分） */
  amount: string;
  /** 签名验证结果 */
  verifyResult: boolean;
  /** 接收时间（UTC，ISO 字符串） */
  receiveTime: string;
  /** 原始报文 */
  rawBody: string;
}
